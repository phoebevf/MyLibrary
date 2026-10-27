import { supabase } from '../supabase/client';
import { Wishlist } from '../types/wishlist';

type WishlistJoinResult = Wishlist & {
  books: { key: string; }[];
};

/**
 * Fetches a user's entire wishlist, joining the necessary Open Library key.
 * @param userId The UUID of the user.
 * @returns A promise that resolves with the list of wishlist items.
 */
export const fetchUserWishlist = async (userId: string): Promise<WishlistJoinResult[]> => {
  const { data, error } = await supabase
    .from('wishlist')
    .select(`
      id, 
      book_id, 
      user_id, 
      created_at,
      books(key) 
    `)
    .eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }
  
  return data as WishlistJoinResult[] || [];
};

/**
 * Adds a book to a user's wishlist.
 * @param bookDbId The Supabase UUID of the book.
 * @param userId The UUID of the user.
 */
export const addBookToWishlist = async (bookDbId: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('wishlist')
    .insert({ book_id: bookDbId, user_id: userId });

  if (error) {
    // Allows the calling function (like the Admin reject logic) to catch the duplicate key error
    throw new Error(error.message);
  }
};

/**
 * Removes a book from a user's wishlist using the book's UUID.
 * @param bookDbId The Supabase UUID of the book.
 * @param userId The UUID of the user.
 */
export const removeBookFromWishlist = async (bookDbId: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('wishlist')
    .delete()
    .eq('book_id', bookDbId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }
};
