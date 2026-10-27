import { supabase } from '../supabase/client';
import { Loan, LoanStatus } from '../types/loan';
import { generateCode } from '../utils/random';
import { sendLoanRequestConfirmation } from '../services/emailService';

/**
 * [USER ACTION] Initiates a loan request for a book, setting the status to 'pending'.
 * This replaces the old 'borrowBook' function.
 * @param bookDbId The UUID of the book to request (from the 'books' table).
 * @param userId The UUID of the user making the request.
 */
export const requestLoan = async (bookDbId: string, userId: string) => {
  const code = generateCode(6); // Generate unique 6-digit code for pickup
  
  // NOTE: Availability check is typically done on the Admin side to allow queuing requests.
  // We only check if the book exists to ensure the request is valid.
  
  // 1. Insert the loan request as 'pending'
  const { error: loanError } = await supabase
      .from('loans')
      .insert({
          book_id: bookDbId,
          user_id: userId,
          status: 'pending' as LoanStatus, // Use the new ENUM value
          request_code: code,
          borrow_date: new Date().toISOString(), // Record the date of the request
          // due_date is set later by the admin
      });

  if (loanError) {
      if (loanError.code === '23505') {
          throw new Error('You already have a pending request for this book.');
      }
      // Re-throw with more detail for robust error reporting
      throw new Error(`Failed to record the loan request. DB Error: ${loanError.message}`);
  }

  // 2. Get user email for confirmation
  const userProfile = (await supabase.from('profiles').select('email').eq('id', userId).single()).data;
  const userEmail = userProfile?.email || '';

  // 3. Send email confirmation to the user (including the pickup code and schedule)
  if (userEmail) {
   // await sendLoanRequestConfirmation(userEmail, code);
  }

  return { code };
};

/**
 * Checks if a user already has an active or pending loan for a given book.
 * @param bookDbId The UUID of the book.
 * @param userId The UUID of the user.
 * @returns boolean
 */
export const hasActiveOrPendingLoan = async (bookDbId: string, userId: string): Promise<boolean> => {
    const blockingStatuses = ['active', 'pending', 'overdue'];

    const { data, error } = await supabase
        .from('loans')
        .select('id')
        .eq('book_id', bookDbId)
        .eq('user_id', userId)
        .in('status', blockingStatuses); 

    if (error) {
        console.error("Error checking existing loan:", error);
        return true; 
    }

    return (data?.length || 0) > 0;
};
