"use client";

import Link from "next/link";
import { useState } from "react";
import {
  User,
  LogOut,
  LayoutDashboard,
  Heart,
  Search,
  Library,
  Star,
  X,
  History,
} from "lucide-react";
import { useAuthStore } from "../../../lib/store/authStore";
import { signOut } from "../../../lib/api/auth";
import styles from "./Navigation.module.css";

interface NavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Navigation({ isOpen, onClose }: NavigationProps) {
  const { user, isAuthenticated } = useAuthStore();
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);

  const isAdmin = user && (user as any).role === "admin";
  const userEmail = user ? user.email : "Not signed in";
  const username = (user as any)?.username || "Not signed in";
  const email = userEmail;

  const handleLogout = async () => {
    await signOut();
    onClose();
  };

  const navLinks = [
    { name: "Browse Catalog", href: "/search", icon: Search },
    { name: "My Loans", href: "/loans", icon: Library },
    { name: "My Favorites", href: "/favorites", icon: Heart },
    { name: "My WishList", href: "/wishlist", icon: Star },
  ];

  return (
    <nav className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
      <div className={styles.sidebarHeader}>
        <button
          onClick={onClose}
          className={styles.closeButton}
          aria-label="Close menu"
        >
          <X size={24} />
        </button>
      </div>

      <div className={styles.navLinks}>
        {navLinks.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            onClick={onClose}
            className={styles.navLink}
          >
            <link.icon size={20} className={styles.navIcon} />
            {link.name}
          </Link>
        ))}

        {isAuthenticated && isAdmin && (
          <>
            <Link
              href="/admin/dashboard"
              onClick={onClose}
              className={`${styles.navLink} ${styles.adminLink}`}
            >
              <LayoutDashboard size={20} className={styles.navIcon} />
              Admin Dashboard
            </Link>

            <Link
              href="/admin/loanHistory"
              onClick={onClose}
              className={styles.navLink}
            >
              <History size={20} className={styles.navIcon} />
              Loan History
            </Link>
          </>
        )}
      </div>

       <div className={styles.sidebarFooter}>
        {isAuthenticated ? (
          <div className={styles.authInfo}>
            <Link
              href="/profile"
              className={styles.profileLink}
              onClick={onClose}
            >
              <User size={24} className={styles.profileIcon} />
              <span className={styles.profileUsername}>{username}</span>
            </Link>
            <button
              onClick={handleLogout}
              className={styles.logoutButton}
              aria-label="Log out"
            >
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <Link href="/login" onClick={onClose} className={styles.loginLink}>
            <User size={24} className={styles.profileIcon} />
            <span className={styles.loginText}>Login / Sign Up</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
