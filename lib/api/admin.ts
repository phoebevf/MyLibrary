import { supabase } from "../supabase/client";
import { Loan, LoanStatus } from "../types/loan";
import { sendLoanRejectedNotification } from "../services/emailService";
import { addBookToWishlist } from "./wishlist";

const API_DATE_ALL_TIME_START = "2020-01-01"
const getTodayDateString = () => new Date().toISOString().split('T')[0];

/**
 * Fetches core metrics for the dashboard.
 */
export const fetchAdminMetrics = async () => {
  // 1. Total Users (from 'profiles' table)
  const { count: totalUsers, error: userError } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  // 2. Total Loans (from 'loans' table)
  const { count: totalLoans, error: loanCountError } = await supabase
    .from("loans")
    .select("*", { count: "exact", head: true });

  // 3. Overdue Loans (active loans where due_date is past)
  const now = new Date().toISOString();
  const { count: overdueCount, error: overdueError } = await supabase
    .from("loans")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")
    .lt("due_date", now);

  if (userError || loanCountError || overdueError) {
    throw new Error("Failed to fetch admin metrics.");
  }

  return {
    totalUsers: totalUsers || 0,
    totalLoans: totalLoans || 0,
    overdueCount: overdueCount || 0,
  };
};

/**
 * Fetches all loan requests needing action (Pending, Active, Overdue).
 */
export const fetchActionableLoans = async () => {
  const excludedStatuses = ["returned", "rejected"];

  const { data, error } = await supabase
    .from("loans")
    .select(
      `
          *,
          profiles(email, username),
          books(key)
        `
    )
    .filter("status", "not.in", `(${excludedStatuses.join(",")})`)

    .order("borrow_date", { ascending: true });

  if (error) {
    throw new Error("Failed to fetch actionable loans: " + error.message);
  }

  const mappedLoans: (Loan & { user_email: string; book_key: string })[] = (
    data || []
  ).map((item: any) => ({
    ...item,
    user_email: item.profiles?.email,
    user_username: item.profiles?.username,
    book_key: item.books?.key,
  }));

  return mappedLoans;
};

/**
 * Sets the loan status to 'returned' (Admin-only).
 */
export const returnBook = async (loanId: string, bookId: string) => {
  const { error: loanError } = await supabase
    .from("loans")
    .update({ status: "returned" })
    .eq("id", loanId);

  const { error: updateBookError } = await supabase.rpc(
    "increment_book_copies",
    { book_id_input: bookId }
  );

  if (loanError || updateBookError) throw new Error("Book return failed.");
};

/**
 * Rejects a pending loan request, notifies the user, and automatically adds the book
 * back to the user's wishlist if it's not already there.
 */
export const rejectLoan = async (loanId: string, bookId: string) => {
  const { data: loan, error: loanError } = await supabase
    .from("loans")
    .update({ status: "rejected" as LoanStatus })
    .eq("id", loanId)
    .select(
      `
            status,
            user_id,
            request_code,
            profiles(email, username),
            books(key)
        `
    )
    .single();

  if (loanError) {
    throw new Error(`Failed to reject loan: ${loanError.message}`);
  }

  if (!loan) {
    throw new Error("Loan record not found after update.");
  }

  const userEmail = (loan.profiles as any)?.email;
  const bookKey = (loan.books as any)?.key;
  const userId = loan.user_id;

  try {
    await addBookToWishlist(bookId, userId);
  } catch (wishlistError: any) {
    if (wishlistError.message.includes("unique constraint")) {
      console.log(`Book ${bookId} is already in user ${userId}'s wishlist.`);
    } else {
      console.error(
        "Failed to add book to wishlist upon rejection:",
        wishlistError
      );
    }
  }

  if (userEmail && bookKey) {
    //  await sendLoanRejectedNotification(userEmail, bookKey);
  }
};

/**
 * Approves a pending loan, sets the due date, and updates book availability.
 * This relies on the SQL RPC function 'decrement_copies_and_increment_popularity'.
 * @param loanId The ID of the pending loan record.
 * @param bookId The ID of the book.
 * @param loanDurationDays Number of days the book is borrowed for.
 */
export const approveLoan = async (
  loanId: string,
  bookId: string,
  loanDurationDays: number
) => {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + loanDurationDays);

  const { error: updateBookError } = await supabase.rpc(
    "decrement_copies_and_increment_popularity",
    { book_id_input: bookId }
  );

  if (updateBookError) {
    throw new Error(
      "Book update failed (may be out of stock or concurrency conflict)."
    );
  }

  const { error: updateLoanError } = await supabase
    .from("loans")
    .update({
      status: "active" as LoanStatus,
      due_date: dueDate.toISOString(),
    })
    .eq("id", loanId);

  if (updateLoanError) {
    throw new Error("Loan approval failed. Could not update loan record.");
  }

  // TODO: Send active loan confirmation email to the user.
};

/**
 * Fetches historical (completed) loan records for administrative review,
 * filtering by a specified date range.
 * NOTE: Only fetches 'returned' and 'rejected' statuses.
 * @param startDate ISO date string to start the range (inclusive).
 * @param endDate ISO date string to end the range (inclusive).
 */
export const fetchLoanHistory = async (startDate: string, endDate: string) => {
  const isAllTimeRange = startDate === API_DATE_ALL_TIME_START; 

  let query = supabase
    .from("loans")
    .select(
      `
          id, 
          book_id, 
          user_id, 
          "borrowDate":borrow_date,   
          "dueDate":due_date,
          status,           
          request_code,
          profiles(email, username),
          books(key)
        `
    )
    .or("status.eq.returned,status.eq.rejected"); 

  if (!isAllTimeRange) {
    query = query.filter("borrow_date::date", "gte", startDate);
  }
  
  // 3. Always apply LTE (End Date) Filter (prevents future records)
  query = query.filter("borrow_date::date", "lte", endDate);

  const { data, error } = await query.order("borrow_date", {
    ascending: false,
  });

  if (error) {
    console.error("Supabase Loan History Fetch Error:", error);
    throw new Error("Failed to fetch loan history: " + error.message);
  }

  const mappedLoans = (data || []).map((item: any) => ({
    ...item,
    user_email: item.profiles?.email,
    user_username: item.profiles?.username,
    book_key: item.books && item.books.length > 0 
                ? item.books[0].key 
                : undefined,
  }));

  return mappedLoans;
};
