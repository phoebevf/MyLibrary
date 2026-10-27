import { create } from 'zustand';
import { searchBooks } from '../api/books';
import { Book, BookSearchParams } from '../types/book';

interface BookStoreState {
  books: Book[];
  isLoading: boolean;
  error: string | null;
  searchParams: BookSearchParams; 
  triggerSearch: (params: Partial<BookSearchParams>) => Promise<void>;
}

const DEFAULT_LIMIT = 12;

export const useBookStore = create<BookStoreState>((set, get) => ({
  books: [],
  isLoading: false,
  error: null,
  searchParams: {
    query: 'fiction', 
    limit: DEFAULT_LIMIT, 
    offset: 0,           
    sortBy: 'popularity', 
    sortOrder: 'desc',
    subject: 'All', 
  },
  
  triggerSearch: async (newParams) => {
    const currentParams = get().searchParams;
    const finalParams = { ...currentParams, ...newParams };

    set({ isLoading: true, error: null, searchParams: finalParams });

    const { query, limit, offset, sortBy, subject } = finalParams;
    
    try {
      const data = await searchBooks(query, limit, offset, sortBy, subject);
      set({ books: data.docs });

    } catch (err) {
      set({ error: 'Failed to load books. Please check API connection.' });
    } finally {
      set({ isLoading: false });
    }
  },
}));
