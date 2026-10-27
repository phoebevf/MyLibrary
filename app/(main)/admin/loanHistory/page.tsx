'use client';

import { Suspense } from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { FileText, Filter } from 'lucide-react';
import { fetchLoanHistory } from '../../../../lib/api/admin';
import styles from './LoanHistoryPage.module.css'; 
import { useAuthStore } from '../../../../lib/store/authStore';
import { useRouter } from 'next/navigation';


const formatDate = (date: Date) => date.toISOString().split('T')[0];
const safeDate = (dateString: string) => new Date(dateString);

const getRangeDates = (range: string) => {
    const now = new Date();
    let startDate = new Date(now);
    const endDate = formatDate(now);

    switch (range) {
        case 'today': 
            break;
        case 'week': 
            startDate.setDate(now.getDate() - 7); 
            break;
        case 'month': 
            startDate.setMonth(now.getMonth() - 1); 
            break;
        case 'last_month':
            startDate.setDate(now.getDate() - 60); 
            break;
        case 'all': 
        default:
            startDate.setFullYear(2020); 
            break;
    }
    return { startDate: formatDate(startDate), endDate };
};

export default function LoanHistoryPage() {
    const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
    const router = useRouter();

    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [rangeSelector, setRangeSelector] = useState<'today' | 'week' | 'month' | 'last_month' | 'custom' | 'all'>('week');
    
    const initialDates = useMemo(() => getRangeDates('week'), []);
    const [fetchRange, setFetchRange] = useState({ start: initialDates.startDate, end: initialDates.endDate });

    const [customStart, setCustomStart] = useState(initialDates.startDate);
    const [customEnd, setCustomEnd] = useState(initialDates.endDate);


    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated || (user as any)?.role !== 'admin') {
            router.push('/');
        }
    }, [authLoading, isAuthenticated, user, router]);


    const loadHistory = useCallback(async (start: string, end: string) => {
        setLoading(true);
        try {
            const data = await fetchLoanHistory(start, end);
            setHistory(data);
        } catch (e) {
            console.error('Failed to load history:', e);
            setHistory([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadHistory(fetchRange.start, fetchRange.end);
    }, [fetchRange, loadHistory]);


    const handleRangeSelectorChange = (newRange: string) => {
        setRangeSelector(newRange as any);
    
    if (newRange !== 'custom') {
        const dates = getRangeDates(newRange);
        
        setFetchRange({ start: dates.startDate, end: dates.endDate }); 
        setCustomStart(dates.startDate);
        setCustomEnd(dates.endDate);
    }
    };

    const handleCustomFilterApply = () => {
        if (customStart && customEnd) {
            setFetchRange({ start: customStart, end: customEnd });
        }
    };

    if (loading) {
        return <div className={styles.statusContainer}><p>Loading complete loan history... 📚</p></div>;
    }
    
    return (
        <div className={styles.historyPage}>
            <h1 className={styles.pageTitle}>
                <FileText size={24} style={{marginRight: '10px'}} /> Complete Loan History
            </h1>
            <p className={styles.pageDescription}>Review all returned and rejected loan records.</p>
            
            <div className={styles.filterControls}>
                <select 
                    value={rangeSelector} 
                    onChange={(e) => handleRangeSelectorChange(e.target.value)}
                    className={styles.selectInput}
                >
                    <option value="today">Today</option>
                    <option value="week">Past Week</option>
                    <option value="month">Past Month</option>
                    <option value="last_month">Last 60 Days</option>
                    <option value="all">All Time</option>
                    <option value="custom">Custom Date Range</option>
                </select>

                {rangeSelector === 'custom' && (
                    <div className={styles.customDateRange}>
                        <label>Start:</label>
                        <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className={styles.dateInput} />
                        <label>End:</label>
                        <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className={styles.dateInput} />
                        <button onClick={handleCustomFilterApply} className={styles.filterButton}>
                            <Filter size={16} /> Apply Filter
                        </button>
                    </div>
                )}
            </div>

            <Suspense>
            <div className={styles.historyResults}>
                {history.length > 0 ? (
                    <HistoryTable loans={history} />
                ) : (
                    <div className={styles.emptyList}><p>No completed or rejected loans found for the selected period.</p></div>
                )}
            </div>
            </Suspense>
        </div>
    );
}


const HistoryTable: React.FC<{ loans: any[] }> = ({ loans }) => (
    <div className={styles.loanTableContainer}>
        <table className={styles.loanTable}>
            <thead>
                <tr>
                    <th>Book Key</th>
                    <th>User</th>
                    <th>Status</th>
                    <th>Borrowed</th>
                    <th>Due / Rejected</th>
                </tr>
            </thead>
            <tbody>
                {loans.map(loan => (
                    <tr key={loan.id} className={loan.status === 'rejected' ? styles.rejectedRow : ''}>
                        <td>{loan.book_key?.split('/').pop() || 'N/A'}</td>
                        <td>{loan.profiles?.username || loan.profiles?.email || 'N/A'}</td>
                        <td>
                            <span className={styles.historyStatusBadge} style={{ backgroundColor: loan.status === 'returned' ? '#008000' : '#ff4d4f' }}>
                                {loan.status.toUpperCase()}
                            </span>
                        </td>
                        <td>{safeDate(loan.borrow_date).toLocaleDateString()}</td>
                        <td>{loan.due_date ? safeDate(loan.due_date).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);
