"use client";

import Link from 'next/link';
import { Menu, User, Moon, Sun } from 'lucide-react';
import useTheme from '../../../hooks/useTheme';
import styles from './Header.module.css';

interface HeaderProps {
  onMenuToggle: () => void;
  onSearchToggle: () => void;
  theme: Theme;
  isDarkMode: boolean;
  setAppTheme: (t: Theme) => void;
}

type Theme = 'light' | 'dark' | 'system';

const ThemeToggle: React.FC<{ theme: Theme, setAppTheme: (t: Theme) => void }> = ({ theme, setAppTheme }) => {
    const isDark = theme === 'dark';
    const Icon = isDark ? Sun : Moon;
    const nextTheme = isDark ? 'light' : 'dark';

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

export default function Header({ onMenuToggle, onSearchToggle }: HeaderProps) {
  const { theme, setAppTheme } = useTheme();

  return (
    <header className={styles.header}>
      <div className={styles.leftGroup}>
        <button onClick={onMenuToggle} className={styles.iconButton} aria-label="Open menu">
          <Menu size={24} />
        </button>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoEmoji}>✨</span>MyLibrary
        </Link>
      </div>

      <div className={styles.rightGroup}>

        <ThemeToggle theme={theme} setAppTheme={setAppTheme} />

        <Link href="/profile" className={styles.iconButton} aria-label="User profile">
          <User size={24} />
        </Link>
      </div>
    </header>
  );
}
