'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchLoanHistory } from '../../lib/api/admin';
import { FileText, Calendar, Filter } from 'lucide-react';
import styles from '../AdminDashboard.module.css';

const formatDate = (date: Date) => date.toISOString().split('T')[0];

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


export default function AdminHistoryView() {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [range, setRange] = useState<'today' | 'week' | 'month' | 'last_month' | 'custom' | 'all'>('week');
    const [customStart, setCustomStart] = useState(getRangeDates('week').startDate);
    const [customEnd, setCustomEnd] = useState(formatDate(new Date()));

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
        let start, end;
        if (range === 'custom') {
            start = customStart;
            end = customEnd;
        } else {
            const dates = getRangeDates(range);
            start = dates.startDate;
            end = dates.endDate;
        }
        loadHistory(start, end);
    }, [range, customStart, customEnd, loadHistory]);

    const handleCustomFilter = () => {
        if (customStart && customEnd) {
            loadHistory(customStart, customEnd);
        }
    };

    return (
        <section className={styles.historySection}>
            <h2 className={styles.sectionTitle}>
                <FileText size={24} className={styles.titleIcon} /> Complete Loan History
            </h2>

            <div className={styles.filterControls}>
                <select 
                    value={range} 
                    onChange={(e) => setRange(e.target.value as any)}
                    className={styles.selectInput}
                >
                    <option value="today">Today</option>
                    <option value="week">Past Week</option>
                    <option value="month">Past Month</option>
                    <option value="last_month">Last Month (Approx)</option>
                    <option value="all">All Time</option>
                    <option value="custom">Custom Date Range</option>
                </select>

                {range === 'custom' && (
                    <div className={styles.customDateRange}>
                        <label>Start:</label>
                        <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className={styles.dateInput} />
                        <label>End:</label>
                        <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className={styles.dateInput} />
                        <button onClick={handleCustomFilter} className={styles.filterButton}>
                            <Filter size={16} /> Filter
                        </button>
                    </div>
                )}
            </div>

            <div className={styles.historyResults}>
                {loading ? (
                    <p>Loading history...</p>
                ) : history.length > 0 ? (
                    <HistoryTable loans={history} />
                ) : (
                    <p>No completed or rejected loans found for this period.</p>
                )}
            </div>
        </section>
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
                        <td>{new Date(loan.borrow_date).toLocaleDateString()}</td>
                        <td>{loan.due_date ? new Date(loan.due_date).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);
