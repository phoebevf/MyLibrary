import { create } from "zustand";
import { supabase } from "../supabase/client";
import { Loan } from "../types/loan";

interface LoanState {
  loans: Loan[];
  isLoading: boolean;
  error: string | null;
  fetchLoans: (userId: string) => Promise<void>;
}

export const useLoanStore = create<LoanState>((set) => ({
  loans: [],
  isLoading: false,
  error: null,

  fetchLoans: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('loans')
        .select(`
          id, 
          book_id, 
          user_id, 
          borrowDate:borrow_date,   
          dueDate:due_date,
          status,           
          request_code,
          books(key, available_copies, popularity)  
        `)
        .eq('user_id', userId)
        .order('borrow_date', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      const mappedLoans: Loan[] = (data || []).map((item: any) => {
          const olKey = item.books ? item.books.key : undefined;
          
          return {
              id: item.id,
              book_id: item.book_id,
              user_id: item.user_id,
              borrowDate: item.borrowDate,
              dueDate: item.dueDate,
              status: item.status, 
              request_code: item.request_code, 
              books: item.books, 
              ol_key: olKey, 
          };
      });

      set({ loans: mappedLoans, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
}));
