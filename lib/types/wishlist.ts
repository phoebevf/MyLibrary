export interface Wishlist {
  id: string;
  book_id: string; 
  user_id: string;
  created_at: string;
  ol_key?: string; 
  books?: { key: string; }; 
}
