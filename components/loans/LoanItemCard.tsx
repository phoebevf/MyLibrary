'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { getDetailedBookData } from '../../lib/api/books';
import { Book } from '../../lib/types/book';
import { Loan } from '../../lib/types/loan';
import { LoanStatus } from '../../lib/types/loan';
import styles from './LoanItemCard.module.css';

interface LoanItemCardProps {
  loan: Loan;
  isActive: boolean;
}

const getStatusLabel = (status: LoanStatus): string => {
    switch (status) {
        case 'active':
            return 'ACTIVE';
        case 'pending':
            return 'PENDING APPROVAL';
        case 'overdue':
            return 'OVERDUE';
        case 'returned':
            return 'RETURNED';
        case 'rejected':
            return 'REJECTED';
        default:
            return 'N/A';
    }
};

export const LoanItemCard: React.FC<LoanItemCardProps> = ({ loan, isActive }) => {
  const [bookDetails, setBookDetails] = useState<Book | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(true);
  
  const olKey = loan.ol_key;
  const isOverdue = loan.status === 'overdue'; 
  const isPending = loan.status === 'pending';
  const isRejected = loan.status === 'rejected';

  useEffect(() => {
    if (!olKey) {
        console.error("Loan item missing OL Key. Cannot fetch book details.");
        setIsDetailsLoading(false);
        return;
    }
    
    const fetchDetails = async () => {
        try {
            const bookData = await getDetailedBookData(olKey);
            setBookDetails(bookData);
        } catch (error) {
            console.error('Failed to fetch book details for loan:', error);
        } finally {
            setIsDetailsLoading(false);
        }
    };
    fetchDetails();
  }, [olKey]);


  if (isDetailsLoading || !bookDetails) {
    return <div className={styles.loanItemSkeleton}>Loading book info...</div>;
  }
  
  const statusClass = (() => {
    switch (loan.status) {
      case 'overdue':
        return styles.statusOverdue;
      case 'rejected':
        return styles.statusRejected;
      case 'pending':
        return styles.statusPending; 
      case 'returned':
        return styles.statusReturned;
      case 'active':
      default:
        return styles.statusActive; 
    }
  })();


  return (
    <div className={`${styles.loanItem} ${isOverdue ? styles.itemOverdue : ''}`}>
      <div className={styles.loanItemInfo}>
        <span className={styles.bookTitle}>{bookDetails.title}</span>
        <span className={styles.bookAuthor}>by {bookDetails.author_name?.[0] || 'Unknown'}</span>
      </div>
      
      <div className={styles.loanItemDates}>
        <div className={styles.dateInfo}>
          <span className={styles.dateLabel}>Borrowed:</span>
          <span className={styles.dateValue}>{new Date(loan.borrowDate).toLocaleDateString()}</span>
        </div>
        
        {isActive && !isPending && (
          <div className={styles.dateInfo}>
            <span className={styles.dateLabel}>Due Date:</span>
            <span className={styles.dateValue}>
                {loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        )}
      </div>

      <div className={styles.loanItemStatus}>
        <span className={`${styles.statusBadge} ${statusClass}`}>
          {getStatusLabel(loan.status)}
        </span>
        
        {isOverdue && (
          <span className={styles.overdueWarning}>
            <AlertTriangle size={14} /> Please return immediately.
          </span>
        )}
      </div>
    </div>
  );
};