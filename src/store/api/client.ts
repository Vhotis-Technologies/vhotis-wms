/**
 * WMS HTTP client — authenticated fetch with automatic token refresh on 401.
 *
 * Mirrors the seller app's RTK axios base query: expired access tokens trigger
 * a single shared refresh, then the original request is retried once.
 */
import { API_CONFIG } from "@/constants/Config";
import type { ApiErrorBody, RefreshResponse } from "@/interfaces/auth";
import {
  getStoredAccessToken,
  getStoredRefreshToken,
} from "@/utils/storage";

/** Thrown when the API returns a non-2xx status with a parsed error body. */
export class ApiRequestError extends Error {
  status: number;
  body: ApiErrorBody;

  /**
   * @param status - HTTP status code from the failed response.
   * @param body - Parsed JSON error payload from the server.
   * @param fallbackMessage - Used when the body has no error/detail/message field.
   */
  constructor(status: number, body: ApiErrorBody, fallbackMessage: string) {
    super(body.error || body.detail || body.message || fallbackMessage);
    this.status = status;
    this.body = body;
  }
}

/** Options passed to {@link wmsFetch} and {@link wmsUploadFile}. */
type RequestOptions = RequestInit & {
  /** When false, no Authorization header is sent (login, refresh). Default true. */
  auth?: boolean;
  /** Internal — skip refresh retry to avoid loops on auth endpoints. */
  _skipAuthRefresh?: boolean;
};

/** Endpoints that must not trigger the 401 refresh-and-retry loop. */
const PUBLIC_PATHS = new Set([
  "/api/v3/wms/auth/login/",
  "/api/v3/wms/auth/refresh/",
]);

/** Pair returned after a successful WMS token refresh. */
type RefreshTokensResult = { access: string; refresh: string };

// Shared in-flight refresh — concurrent 401s await the same promise.
let refreshPromise: Promise<RefreshTokensResult> | null = null;

/**
 * Resolve the current access token for outbound requests.
 *
 * Prefers the in-memory Zustand session (Remember-me off) over SecureStore.
 */
async function resolveAccessToken(): Promise<string | null> {
  const { useAuthStore } = await import("@/store/slices/authSlice");
  const inMemory = useAuthStore.getState().access;
  if (inMemory) {
    return inMemory;
  }
  // Fall back to persisted session when the app was restored from SecureStore.
  return getStoredAccessToken();
}

/**
 * Resolve the refresh token used to obtain a new access token.
 *
 * Prefers in-memory state, then SecureStore.
 */
async function resolveRefreshToken(): Promise<string | null> {
  const { useAuthStore } = await import("@/store/slices/authSlice");
  const inMemory = useAuthStore.getState().refresh;
  if (inMemory) {
    return inMemory;
  }
  return getStoredRefreshToken();
}

/**
 * Apply refreshed tokens to Zustand and optionally persist to SecureStore.
 *
 * @param access - New JWT access token.
 * @param refresh - New JWT refresh token (rotation).
 */
async function persistRefreshedTokens(
  access: string,
  refresh: string,
): Promise<void> {
  const { useAuthStore } = await import("@/store/slices/authSlice");
  const { saveAuthSession } = await import("@/utils/storage");
  const state = useAuthStore.getState();

  useAuthStore.setState({
    access,
    refresh,
    isAuthenticated: true,
  });

  // Only write SecureStore when the user opted into Remember me at login.
  if (state.rememberMe && state.employee) {
    await saveAuthSession(access, refresh, state.employee);
  }
}

/** Clear local session after refresh failure so the app can redirect to login. */
async function clearSessionOnAuthFailure(): Promise<void> {
  const { useAuthStore } = await import("@/store/slices/authSlice");
  const { clearAuthSession } = await import("@/utils/storage");
  await clearAuthSession();
  useAuthStore.setState({
    isAuthenticated: false,
    employee: null,
    access: null,
    refresh: null,
  });
}

/**
 * Exchange the refresh token for a new access/refresh pair.
 *
 * Uses raw fetch (not {@link wmsFetch}) to avoid circular imports with authApi.
 * Deduplicates parallel callers via {@link refreshPromise}.
 *
 * @throws Error `NO_REFRESH_TOKEN` when no refresh token is available.
 * @throws Error `REFRESH_FAILED` when the server rejects the refresh request.
 */
async function refreshAccessToken(): Promise<RefreshTokensResult> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refresh = await resolveRefreshToken();
      if (!refresh) {
        throw new Error("NO_REFRESH_TOKEN");
      }

      // Call refresh directly — must not go through wmsFetch (would recurse on 401).
      const response = await fetch(
        `${API_CONFIG.baseURL}/api/v3/wms/auth/refresh/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh }),
        },
      );

      const text = await response.text();
      let data: RefreshResponse | ApiErrorBody = {} as RefreshResponse;
      if (text) {
        data = JSON.parse(text) as RefreshResponse | ApiErrorBody;
      }

      if (!response.ok) {
        throw new Error("REFRESH_FAILED");
      }

      const tokens = data as RefreshResponse;
      if (!tokens.access || !tokens.refresh) {
        throw new Error("REFRESH_FAILED");
      }

      await persistRefreshedTokens(tokens.access, tokens.refresh);
      return { access: tokens.access, refresh: tokens.refresh };
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

/**
 * Parse a response body as JSON, or return an empty object for empty bodies.
 *
 * @param text - Raw response text from fetch.
 * @param status - HTTP status (used in the error message when JSON is invalid).
 */
function parseResponseBody<T>(text: string, status: number): T | ApiErrorBody {
  if (!text) {
    return {} as T;
  }
  try {
    return JSON.parse(text) as T | ApiErrorBody;
  } catch {
    throw new ApiRequestError(status, {}, "Invalid JSON response from server.");
  }
}

/**
 * Build request headers, optionally attaching Bearer auth.
 *
 * @param initHeaders - Caller-supplied headers merged into the result.
 * @param auth - When true, attach Authorization if a token is available.
 * @param accessOverride - Use after refresh to skip re-reading storage.
 */
async function buildAuthHeaders(
  initHeaders: HeadersInit | undefined,
  auth: boolean,
  accessOverride?: string | null,
): Promise<Headers> {
  const headers = new Headers(initHeaders);

  if (auth) {
    const access = accessOverride ?? (await resolveAccessToken());
    if (access) {
      headers.set("Authorization", `Bearer ${access}`);
    }
  }

  return headers;
}

/**
 * Execute one authenticated JSON request with optional 401 refresh-and-retry.
 *
 * @param path - API path (e.g. `/api/v3/receiving/tag_receipt_line/`).
 * @param options - Fetch init plus WMS auth flags.
 * @param fallbackError - Message prefix when throwing {@link ApiRequestError}.
 */
async function executeFetch<T>(
  path: string,
  options: RequestOptions,
  fallbackError: string,
): Promise<T> {
  const {
    auth = true,
    headers: initHeaders,
    _skipAuthRefresh = false,
    ...rest
  } = options;

  const headers = await buildAuthHeaders(initHeaders, auth);
  if (!headers.has("Content-Type") && rest.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_CONFIG.baseURL}${path}`, {
    ...rest,
    headers,
  });

  const text = await response.text();
  const data = parseResponseBody<T>(text, response.status);

  if (response.ok) {
    return data as T;
  }

  // Only refresh on 401 for authenticated, non-public routes.
  const canRefresh =
    auth &&
    response.status === 401 &&
    !_skipAuthRefresh &&
    !PUBLIC_PATHS.has(path);

  if (canRefresh) {
    try {
      const { access: newAccess } = await refreshAccessToken();
      const retryHeaders = await buildAuthHeaders(initHeaders, auth, newAccess);
      if (!retryHeaders.has("Content-Type") && rest.body) {
        retryHeaders.set("Content-Type", "application/json");
      }

      // Retry the original request once with the new access token.
      const retryResponse = await fetch(`${API_CONFIG.baseURL}${path}`, {
        ...rest,
        headers: retryHeaders,
      });

      const retryText = await retryResponse.text();
      const retryData = parseResponseBody<T>(retryText, retryResponse.status);

      if (retryResponse.ok) {
        return retryData as T;
      }

      throw new ApiRequestError(
        retryResponse.status,
        retryData as ApiErrorBody,
        fallbackError,
      );
    } catch (error) {
      // Propagate business errors from the retried call unchanged.
      if (error instanceof ApiRequestError) {
        throw error;
      }
      // Refresh failed or no refresh token — force re-login.
      await clearSessionOnAuthFailure();
      throw new ApiRequestError(
        401,
        {},
        "Session expired. Please sign in again.",
      );
    }
  }

  throw new ApiRequestError(
    response.status,
    data as ApiErrorBody,
    fallbackError,
  );
}

/**
 * Authenticated JSON fetch against the WMS API.
 *
 * Automatically refreshes expired access tokens on 401 and retries once.
 *
 * @param path - Relative API path under {@link API_CONFIG.baseURL}.
 * @param options - Standard fetch options; set `auth: false` for public routes.
 * @returns Parsed JSON response body.
 * @throws {@link ApiRequestError} on HTTP errors or after refresh failure.
 */
export async function wmsFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  return executeFetch<T>(
    path,
    options,
    `Request failed with status`,
  );
}

/** Local file reference for React Native multipart uploads. */
type UploadFilePart = {
  uri: string;
  name: string;
  type: string;
};

/**
 * Upload a single file via multipart/form-data with the same 401 refresh flow as {@link wmsFetch}.
 *
 * @param path - Relative API path under {@link API_CONFIG.baseURL}.
 * @param fieldName - Form field name expected by the server.
 * @param file - Local file descriptor (uri, name, mime type).
 * @param options - Fetch init minus body; `auth` defaults to true.
 */
export async function wmsUploadFile<T>(
  path: string,
  fieldName: string,
  file: UploadFilePart,
  options: Omit<RequestOptions, "body"> = {},
): Promise<T> {
  const {
    auth = true,
    headers: initHeaders,
    _skipAuthRefresh = false,
    ...rest
  } = options;

  /** Perform one upload attempt, optionally forcing a freshly refreshed access token. */
  const runUpload = async (accessOverride?: string | null): Promise<Response> => {
    const headers = await buildAuthHeaders(initHeaders, auth, accessOverride);

    const formData = new FormData();
    formData.append(fieldName, {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as unknown as Blob);

    return fetch(`${API_CONFIG.baseURL}${path}`, {
      ...rest,
      method: rest.method ?? "POST",
      headers,
      body: formData,
    });
  };

  let response = await runUpload();
  let text = await response.text();
  let data = parseResponseBody<T>(text, response.status);

  const canRefresh =
    auth &&
    response.status === 401 &&
    !_skipAuthRefresh &&
    !PUBLIC_PATHS.has(path);

  if (canRefresh) {
    try {
      const { access: newAccess } = await refreshAccessToken();
      response = await runUpload(newAccess);
      text = await response.text();
      data = parseResponseBody<T>(text, response.status);
    } catch (error) {
      if (error instanceof ApiRequestError) {
        throw error;
      }
      await clearSessionOnAuthFailure();
      throw new ApiRequestError(
        401,
        {},
        "Session expired. Please sign in again.",
      );
    }
  }

  if (!response.ok) {
    throw new ApiRequestError(
      response.status,
      data as ApiErrorBody,
      `Upload failed with status ${response.status}`,
    );
  }

  return data as T;
}
