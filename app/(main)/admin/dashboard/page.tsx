'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Users, BookOpen, Clock, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../../../../lib/store/authStore'; 
import { fetchAdminMetrics, fetchActionableLoans, returnBook, rejectLoan, approveLoan } from '../../../../lib/api/admin';
import AdminLoanList from '../../../../components/loans/AdminLoanList'; 
import styles from './AdminDashboard.module.css'; 

const isAdminUser = (user: any) => user && user.role === 'admin';

export default function AdminDashboardPage() {



  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const router = useRouter();
  const [metrics, setMetrics] = useState<any>(null);
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleAction = useCallback(async (action: 'approve' | 'return' | 'reject', loanId: string, bookId: string, duration?: number) => {
    try {
      setLoading(true);
      
      if (action === 'approve') {
        if (duration === undefined) throw new Error('Duration is required for approval.');
        await approveLoan(loanId, bookId, duration);
      } else if (action === 'return') {
        await returnBook(loanId, bookId);
      } else if (action === 'reject') {
        await rejectLoan(loanId, bookId); 
      }
      
      const [metricData, loanData] = await Promise.all([
        fetchAdminMetrics(),
        fetchActionableLoans(),
      ]);
      setMetrics(metricData);
      setLoans(loanData);

    } catch (err: any) {
      setError(err.message || `Action failed: ${action}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated || !isAdminUser(user)) {
      router.push('/');
      return;
    }

    const loadData = async () => {
      try {
        const [metricData, loanData] = await Promise.all([
          fetchAdminMetrics(),
          fetchActionableLoans(),
        ]);
        setMetrics(metricData);
        setLoans(loanData);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [authLoading, isAuthenticated, user, router]);

  if (loading) {
    return <div className={styles.statusContainer}><p>Loading Admin Dashboard... ⚙️</p></div>;
  }

  if (error) {
    return <div className={styles.statusContainer}><p className={styles.errorMessage}>{error}</p></div>;
  }

  const pendingLoans = loans.filter(l => l.status === 'pending');
  const activeLoans = loans.filter(l => l.status === 'active' || l.status === 'overdue');

  return (
    <div className={styles.dashboard}>
      <h1 className={styles.pageTitle}>Admin Dashboard</h1>

      <div className={styles.metricsGrid}>
        <MetricCard icon={<Users size={24} />} title="Total Users" value={metrics.totalUsers} color="pink" />
        <MetricCard icon={<BookOpen size={24} />} title="Total Loans" value={metrics.totalLoans} color="blue" />
        <MetricCard icon={<AlertTriangle size={24} />} title="Overdue Loans" value={metrics.overdueCount} color="red" />
        <MetricCard icon={<Clock size={24} />} title="Pending Requests" value={pendingLoans.length} color="yellow" />
      </div>

      <section className={styles.loanSection}>
        <h2 className={styles.sectionTitle}>
          Pending Loan Requests ({pendingLoans.length})
        </h2>
        <AdminLoanList 
          loans={pendingLoans} 
          onAction={handleAction} 
          type="pending" 
        />
      </section>

      <section className={styles.loanSection}>
        <h2 className={styles.sectionTitle}>
          Active & Overdue Loans ({activeLoans.length})
        </h2>
        <AdminLoanList 
          loans={activeLoans} 
          onAction={handleAction} 
          type="active" 
        />
      </section>
    </div>
  );
}

const MetricCard = ({ icon, title, value, color }: { icon: React.ReactNode, title: string, value: number, color: string }) => (
    <div className={`${styles.metricCard} ${styles[`metric-${color}`]}`}>
        <div className={styles.metricIcon}>{icon}</div>
        <div className={styles.metricInfo}>
            <p className={styles.metricTitle}>{title}</p>
            <h3 className={styles.metricValue}>{value}</h3>
        </div>
    </div>
);
