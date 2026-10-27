'use client';

import { useState, useMemo } from 'react';
import { CheckCircle, X, Loader, Trash2 } from 'lucide-react';
import { ConfirmationModal } from '../ui/Modal/ConfirmationModal';
import { AdminLoan } from '../../lib/types/loan';
import styles from '../../app/(main)/admin/dashboard/AdminDashboard.module.css';

// Get today's date string (YYYY-MM-DD)
const getTodayString = () => new Date().toISOString().split('T')[0];
// Get max due date (30 days from now)
const getMaxDateString = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
};

interface AdminLoanRowProps {
  loan: AdminLoan;
  onAction: (action: 'approve' | 'return' | 'reject', loanId: string, bookId: string, duration?: number) => Promise<void>;
}

export default function AdminLoanRow({ loan, onAction }: AdminLoanRowProps) {
    // State to manage input method and value for Approval
    const [durationDays, setDurationDays] = useState(14);
    const [selectedDate, setSelectedDate] = useState(getMaxDateString()); 
    const [inputMethod, setInputMethod] = useState<'duration' | 'calendar'>('duration');

    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

    const isOverdue = loan.status === 'overdue';
    const statusInfo = {
        pending: { label: 'PENDING', color: 'var(--color-pink-secondary)' },
        active: { label: 'ACTIVE', color: 'var(--color-success)' },
        overdue: { label: 'OVERDUE', color: 'var(--color-danger)' },
        returned: { label: 'RETURNED', color: 'var(--color-text-muted)' },
        rejected: { label: 'REJECTED', color: 'var(--color-danger)' },
    }[loan.status] || { label: 'N/A', color: 'var(--color-text-muted)' };


    const finalDuration = useMemo(() => {
        if (inputMethod === 'duration') {
            return durationDays;
        } else {
            const today = Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
            const selectedDateParts = selectedDate.split('-').map(Number);
            const selected = Date.UTC(selectedDateParts[0], selectedDateParts[1] - 1, selectedDateParts[2]); 
            const diffTime = selected - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return Math.max(1, diffDays); 
        }
    }, [durationDays, selectedDate, inputMethod]);


    const handleConfirmApprove = async () => {
        setIsApprovalModalOpen(false);
        setActionLoading('approve');
        try {
            await onAction('approve', loan.id, loan.book_id, finalDuration);
        } catch (e) {
            console.error('Approval failed:', e);
        } finally {
            setActionLoading(null);
        }
    };
    
    const handleConfirmReject = async () => {
        setIsRejectModalOpen(false);
        setActionLoading('reject');
        try {
            await onAction('reject', loan.id, loan.book_id); 
        } catch (e) {
            console.error('Rejection failed:', e);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReturn = async () => {
        if (window.confirm(`Confirm return for ${loan.user_username || loan.user_email}?`)) {
            setActionLoading('return');
            try {
                await onAction('return', loan.id, loan.book_id);
            } catch (e) {
                console.error('Return failed:', e);
            } finally {
                setActionLoading(null);
            }
        }
    };


    const dateDisplay = (loan.status === 'active' || loan.status === 'overdue')
        ? new Date(loan.dueDate).toLocaleDateString()
        : 'N/A';
        
    const ApprovalModalContent = (
        <div className={styles.dateControlContainer}>
            <p className={styles.durationNote}>Loan Duration: **{finalDuration} days**</p>
            
            <div className={styles.inputToggleGroup}>
                <button 
                    onClick={() => setInputMethod('duration')} 
                    className={`${styles.toggleButton} ${inputMethod === 'duration' ? styles.activeToggle : ''}`}
                >
                    Set Days
                </button>
                <button 
                    onClick={() => setInputMethod('calendar')} 
                    className={`${styles.toggleButton} ${inputMethod === 'calendar' ? styles.activeToggle : ''}`}
                >
                    Select Date
                </button>
            </div>
            
            {inputMethod === 'duration' && (
                <div className={styles.durationInputGroup}>
                    <input 
                        type="number" 
                        name="duration"
                        id={`duration-input-${loan.id}`}
                        value={durationDays} 
                        onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            setDurationDays(Math.max(1, Math.min(val, 30))); 
                        }} 
                        min="1"
                        max="30"
                        className={styles.durationInput}
                    />
                    <span>days</span>
                </div>
            )}

            {inputMethod === 'calendar' && (
                <input
                    type="date"
                    name="dueDate"
                    id={`date-input-${loan.id}`}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={getTodayString()} // Cannot select dates before today
                    max={getMaxDateString()} // Limit to 30 days maximum
                    className={styles.calendarInput}
                />
            )}
        </div>
    );

    return (
        <> 
            <tr className={isOverdue ? styles.overdueRow : ''}>
                <td>{loan.book_key.split('/').pop() || 'Key Missing'}</td>
                <td>
                    <span className={styles.requesterUsername}>{loan.user_username || loan.user_email}</span>
                    <span className={styles.requesterEmail}>({loan.user_email})</span>
                </td>
                <td>
                    {loan.status === 'pending' && <p>Code: <strong>{loan.request_code}</strong></p>}
                    {(loan.status === 'active' || loan.status === 'overdue') && <p>Due: {dateDisplay}</p>}
                    {isOverdue && <span className={styles.overdueWarning}>OVERDUE!</span>}
                </td>
                <td><span className={styles.statusBadge} style={{ backgroundColor: statusInfo.color }}>{statusInfo.label}</span></td>
                <td>
                    {loan.status === 'pending' && (
                        <button onClick={() => setIsApprovalModalOpen(true)} className={styles.actionApprove} disabled={actionLoading !== null}>
                            <CheckCircle size={16} /> Approve
                        </button>
                    )}
                    {loan.status === 'pending' && (
                        <button onClick={() => setIsRejectModalOpen(true)} className={styles.actionReject} disabled={actionLoading !== null}>
                            <Trash2 size={16} /> Reject
                        </button>
                    )}
                    {(loan.status === 'active' || loan.status === 'overdue') && (
                        <button onClick={handleReturn} disabled={actionLoading !== null} className={styles.actionReturn}>
                            {actionLoading === 'return' ? <Loader size={16} className={styles.spinner} /> : <CheckCircle size={16} />} Return
                        </button>
                    )}
                </td>
            </tr>

            {/* --- Modals --- */}
            <ConfirmationModal
                isOpen={isApprovalModalOpen}
                onClose={() => setIsApprovalModalOpen(false)}
                onConfirm={handleConfirmApprove}
                title="Confirm Loan Approval"
                message={`Set the loan duration (max 30 days). The calculated due date is highlighted on the calendar.`}
                confirmLabel={`Approve Loan for ${finalDuration} days`}
                isLoading={actionLoading === 'approve'}
                countdownSeconds={5} 
                content={ApprovalModalContent} // Pass the custom content
            />

            <ConfirmationModal
                isOpen={isRejectModalOpen}
                onClose={() => setIsRejectModalOpen(false)}
                onConfirm={handleConfirmReject}
                title="Confirm Loan REJECTION"
                message={`Are you sure you want to REJECT the request from ${loan.user_username}? This action is irreversible.`}
                confirmLabel="Reject Request"
                isLoading={actionLoading === 'reject'}
                countdownSeconds={5} 
            />
        </>
    );
}
