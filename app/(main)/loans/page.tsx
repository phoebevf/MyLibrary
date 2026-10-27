'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Hourglass } from 'lucide-react';
import { useAuthStore } from '../../../lib/store/authStore';
import { useLoanStore } from '../../../lib/store/loanStore';
import { LoanItemCard } from '../../../components/loans/LoanItemCard'; 
import styles from './LoansPage.module.css'; 

const getTodayDateString = () => new Date().toISOString().split('T')[0];

export default function LoansPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { loans, isLoading, error, fetchLoans } = useLoanStore();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (isAuthenticated && user?.id) {
      fetchLoans(user.id);
    }
  }, [isAuthenticated, authLoading, user, router, fetchLoans]);

  const { userActiveLoans, loanHistory } = useMemo(() => {
    const today = getTodayDateString();
    
    const history = loans.filter(loan => 
        loan.status === 'returned' || loan.status === 'rejected'
    );

    const managedStatuses = ['active', 'pending', 'overdue'];
    
    const managedLoans = loans.filter(loan => 
        managedStatuses.includes(loan.status)
    );
    
    const overdue = managedLoans.filter(loan => 
        loan.status === 'active' && loan.dueDate && loan.dueDate < today 
    );
    const pending = managedLoans.filter(loan => 
        loan.status === 'pending'
    );
    const activeCurrent = managedLoans.filter(loan => 
        loan.status === 'active' && loan.dueDate && loan.dueDate >= today
    );
    
    const prioritizedActiveLoans = [
        ...overdue, 
        ...pending, 
        ...activeCurrent
    ];

    return { 
        userActiveLoans: prioritizedActiveLoans, 
        loanHistory: history,
    };
  }, [loans]);

  if (authLoading || !user) {
    return <div className={styles.statusContainer}><p>Checking session status... ⏳</p></div>;
  }
  
  if (isLoading) {
    return <div className={styles.statusContainer}><p>Loading your loan records... 📚</p></div>;
  }
  
  if (error) {
    return <div className={styles.statusContainer}><p className={styles.errorMessage}>Error fetching loans: {error}</p></div>;
  }

  return (
    <div className={styles.loansPage}>
      <h1 className={styles.pageTitle}>My Book Loans</h1>
      <p className={styles.pageDescription}>
        Track your borrowed books and view due dates.
      </p>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <Hourglass size={20} className={styles.titleIcon} /> Active Loans & Requests ({userActiveLoans.length})
        </h2>
        
        {userActiveLoans.length === 0 ? (
          <div className={styles.emptyState}>You have no pending or active loans.</div>
        ) : (
          <div className={styles.loanList}>
            {userActiveLoans.map(loan => (
              <LoanItemCard key={loan.id} loan={loan} isActive={true} />
            ))}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <Clock size={20} className={styles.titleIcon} /> Loan History ({loanHistory.length})
        </h2>
        
        {loanHistory.length === 0 ? (
          <div className={styles.emptyState}>No previous loan records found.</div>
        ) : (
          <div className={styles.loanList}>
            {loanHistory.map(loan => (
              <LoanItemCard key={loan.id} loan={loan} isActive={false} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
