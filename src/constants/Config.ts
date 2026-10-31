import Constants from "expo-constants";

const getConfig = () =>
  Constants.expoConfig?.extra ??
  (Constants.manifest as { extra?: Record<string, unknown> })?.extra ??
  {};

const config = getConfig();

export const API_CONFIG = {
  baseURL: (config.baseURL as string) || "http://10.0.2.2:8000/m",
};

export const APP_CONFIG = {
  name: Constants.expoConfig?.name || "Vhotis WMS",
  version: Constants.expoConfig?.version || "1.0.0",
  scheme: Constants.expoConfig?.scheme || "vhotiswms",
};

if (!config.baseURL) {
  console.warn(
    "Missing baseURL in app.json extra — using Android emulator default.",
  );
}
