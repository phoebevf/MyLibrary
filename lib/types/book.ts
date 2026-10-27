export interface Book {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  isbn?: string[];
  cover_i?: number;
  subject?: string[];
  description?: string;
  db_id?: string; // UUID from the Supabase books table
  available_copies?: number;
  popularity?: number;
  availability?: {
    is_available: boolean;
    due_date?: string;
  };
}

export interface BookSearchResponse {
  docs: Book[];
  numFound: number;
  start: number;
}

export interface BookFilters {
  query: string;
  subject: string;
  sort: 'relevance' | 'newest' | 'oldest';
}

export interface BookSearchParams {
  query: string;
  limit: number;
  offset: number;
  sortBy: 'title' | 'author' | 'popularity'; 
  sortOrder: 'asc' | 'desc';
  subject?: string; 
  genre?: string;
}