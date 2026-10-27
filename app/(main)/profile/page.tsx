'use client';

import Link from "next/link";
import { useEffect } from 'react';
import { useAuthStore } from '../../../lib/store/authStore';
import { useLoanStore } from '../../../lib/store/loanStore';
import { signOut } from '../../../lib/api/auth';
import { useRouter } from 'next/navigation';
import { LogOut, User, Clock, CheckCircle } from 'lucide-react';
import styles from './ProfilePage.module.css';

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, fetchUser } = useAuthStore();
  const { loans, fetchLoans } = useLoanStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
    if (isAuthenticated && user?.id && loans.length === 0) {
      fetchLoans(user.id);
    }
  }, [isAuthenticated, isLoading, user, router, fetchLoans, loans.length]);

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  if (isLoading || !user) {
    return (
      <div className={styles.statusContainer}>
        <p>Loading user profile... 💖</p>
      </div>
    );
  }

  const username = (user as any).username || (user.email ? user.email.split('@')[0] : 'User');
  const email = user.email || 'N/A';
  const role = (user as any).role || 'user';
  
  const totalLoansCount = loans.length; 

  return (
    <div className={styles.profilePage}>
      <div className={styles.profileCard}>
        <h1 className={styles.pageTitle}>Welcome, {username}</h1>
        
        <div className={styles.userInfoSection}>
            <p className={styles.userInfoItem}>
                <User size={18} className={styles.icon} /> 
                Account Type: <span className={styles.infoValue}>{role.toUpperCase()}</span>
            </p>
            <p className={styles.userInfoItem}>
                <CheckCircle size={18} className={styles.icon} /> 
                Email: <span className={styles.infoValue}>{email}</span>
            </p>
            <p className={styles.userInfoItem}>
                <Clock size={18} className={styles.icon} /> 
                Total Loans Recorded: <span className={styles.infoValue}>{totalLoansCount}</span>
            </p>
            <p className={styles.userInfoItem}>
                <Link href="/loans" className={styles.historyLink}>
                    View Active Loans & Requests →
                </Link>
            </p>
        </div>

        <div className={styles.logoutContainer}>
            <button onClick={handleLogout} className={styles.logoutButton}>
                <LogOut size={20} style={{ marginRight: '10px' }} />
                Log Out
            </button>
        </div>
      </div>
    </div>
  );
}
