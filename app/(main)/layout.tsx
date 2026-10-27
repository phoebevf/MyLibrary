"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import useTheme from "../../hooks/useTheme";
import Header from "../../components/layout/Header/Header";
import Navigation from "../../components/layout/Navigation/Navigation";
import styles from "./MainLayout.module.css";

type Theme = "light" | "dark" | "system";

interface ThemeToggleProps {
  theme: Theme;
  isDarkMode: boolean;
  setAppTheme: (t: Theme) => void;
  mounted: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
  theme,
  isDarkMode,
  setAppTheme,
  mounted,
}) => {
  const Icon = isDarkMode ? Sun : Moon;
  const nextTheme = isDarkMode ? "light" : "dark";

  if (!mounted) {
    return <div style={{ width: "24px", height: "24px" }} />;
  }

  return (
    <button
      onClick={() => setAppTheme(nextTheme)}
      className={styles.iconButton}
      aria-label={`Switch to ${nextTheme} mode`}
    >
      <Icon size={24} />
    </button>
  );
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const { theme, isDarkMode, setAppTheme } = useTheme();

  const toggleMobileSidebar = () => {
    setIsSidebarOpen((prev: boolean) => !prev);
  };

  const isDesktopOpen = true;


  return (
    <div>
      <div>
        <div
          className={`${styles.layoutContainer} ${
            isDesktopOpen ? styles.contentShifted : ""
          }`}
        >
          <Header
            onMenuToggle={toggleMobileSidebar}
            onSearchToggle={() => setIsSearchVisible(!isSearchVisible)}
            theme={theme}
            isDarkMode={isDarkMode}
            setAppTheme={setAppTheme}
          />
          <Navigation isOpen={isSidebarOpen} onClose={toggleMobileSidebar} />
          {isSidebarOpen && (
            <div className={styles.overlay} onClick={toggleMobileSidebar} />
          )}

          <main className={styles.mainContent}>{children}</main>
        </div>
      </div>
    </div>
  );
}
