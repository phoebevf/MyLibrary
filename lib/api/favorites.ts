import { supabase } from '../supabase/client';
import { Favorite } from '../types/favorite';

// Define a type for the complex data structure returned by the JOIN query
type FavoriteJoinResult = Favorite & {
  books: { key: string; }[];
};

/**
 * Fetches a user's favorite books, joining the necessary Open Library key.
 */
export const fetchUserFavorites = async (userId: string): Promise<FavoriteJoinResult[]> => {
  const { data, error } = await supabase
    .from('favorites')
    .select(`
      id, 
      book_id, 
      user_id, 
      added_at,
      books(key) 
    `)
    .eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }
  
  return data as FavoriteJoinResult[] || [];
};

/**
 * Adds a book to a user's favorites.
 */
export const addBookToFavorites = async (bookDbId: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('favorites')
    .insert({ book_id: bookDbId, user_id: userId });

  if (error) {
    throw new Error(error.message);
  }
};

/**
 * Removes a book from a user's favorites.
 */
export const removeBookFromFavorites = async (bookDbId: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('book_id', bookDbId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }
};
