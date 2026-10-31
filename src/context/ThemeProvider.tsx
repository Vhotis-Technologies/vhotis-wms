import { useLoadedFonts } from "@/hooks/useLoadedFonts";
import { createContext, useContext, useState, useEffect } from "react";
import { ActivityIndicator, useColorScheme } from "react-native";
import * as SecureStore from "expo-secure-store";

type ThemeMode = "light" | "dark" | "system";

const ThemeContext = createContext({
  theme: "system" as ThemeMode,
  setTheme: (theme: ThemeMode) => {},
  currentTheme: "light" as "light" | "dark",
});

const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const fontsLoaded = useLoadedFonts();
  const [theme, setTheme] = useState<ThemeMode>("system");
  const [isLoading, setIsLoading] = useState(true);
  const systemColorScheme = useColorScheme();

  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const savedTheme = await SecureStore.getItemAsync("userTheme");
        if (
          savedTheme &&
          (savedTheme === "light" ||
            savedTheme === "dark" ||
            savedTheme === "system")
        ) {
          setTheme(savedTheme as ThemeMode);
        }
      } catch (error) {
        console.log("Error loading saved theme:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedTheme();
  }, []);

  const saveTheme = async (newTheme: ThemeMode) => {
    try {
      await SecureStore.setItemAsync("userTheme", newTheme);
    } catch (error) {}
  };

  const setThemeAndSave = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    saveTheme(newTheme);
  };

  const currentTheme = (() => {
    if (theme === "system") {
      return systemColorScheme === "dark" ? "dark" : "light";
    }
    return theme === "dark" ? "dark" : "light";
  })();

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme: setThemeAndSave, currentTheme }}
    >
      {fontsLoaded && !isLoading ? (
        children
      ) : (
        <ActivityIndicator size="large" color={"#000"} />
      )}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeContext must be used within a ThemeProvider");
  }
  return context;
};

export default ThemeProvider;
