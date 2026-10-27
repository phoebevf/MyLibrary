export interface Favorite {
  id: string;
  book_id: string; // Supabase UUID
  user_id: string;
  added_at: string;
  
  ol_key?: string; 
  books?: { key: string; }[]; 
}
