export type LoanStatus = 'pending' | 'active' | 'overdue' | 'rejected' | 'returned';

export interface Loan {
  id: string;
  book_id: string;
  user_id: string;
  borrowDate: string;
  dueDate: string;
  status: LoanStatus; 
  request_code: string; 
  
  books?: { 
    key: string; 
    available_copies: number;
    popularity: number;
  };
  ol_key?: string; 
}

export interface AdminLoan {
    id: string;
    book_id: string;
    user_id: string;
    borrowDate: string;
    dueDate: string;
    status: LoanStatus; 
    request_code: string; 
    
    // Joined Data from API:
    user_email: string;
    user_username: string;
    book_key: string;
}
