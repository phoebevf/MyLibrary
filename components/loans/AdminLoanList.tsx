'use client';

import AdminLoanRow from './AdminLoanRow'; 
import styles from '../../app/(main)/admin/dashboard/AdminDashboard.module.css';

interface AdminLoanListProps {
  loans: any[]; 
  onAction: (action: 'approve' | 'return' | 'reject', loanId: string, bookId: string, duration?: number) => Promise<void>;
  type: 'pending' | 'active';
}

export default function AdminLoanList({ loans, onAction, type }: AdminLoanListProps) {
    if (loans.length === 0) {
        return <div className={styles.emptyList}>No {type} loans to display.</div>;
    }
    
    return (
        <div className={styles.loanTableContainer}>
            <table className={styles.loanTable}>
                <thead>
                    <tr>
                        <th>Book / OL Key</th>
                        <th>Requester</th>
                        <th>Code / Due Date</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {loans.map((loan) => (
                        <AdminLoanRow 
                            key={loan.id} 
                            loan={loan} 
                            onAction={onAction} 
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}
