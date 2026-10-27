import { create } from "zustand";
import { Wishlist } from "../types/wishlist";
import {
  fetchUserWishlist,
  addBookToWishlist,
  removeBookFromWishlist,
} from "../api/wishlist";

interface WishlistState {
  wishlist: Wishlist[];
  isLoading: boolean;
  error: string | null;
  fetchWishlist: (userId: string) => Promise<void>;
  toggleWishlist: (
    bookDbId: string,
    userId: string,
    isCurrentlyWishlisted: boolean
  ) => Promise<void>;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  wishlist: [],
  isLoading: false,
  error: null,

  fetchWishlist: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchUserWishlist(userId);

      const mappedWishlist: Wishlist[] = (data || []).map((item: any) => {
        const books = item.books;
        let olKey = undefined;

        if (Array.isArray(books) && books.length > 0) {
          olKey = books[0].key;
        } else if (books && books.key) {
          olKey = books.key;
        }

        return {
          id: item.id,
          book_id: item.book_id,
          user_id: item.user_id,
          created_at: item.created_at,
          books: item.books,
          ol_key: olKey,
        };
      });

      set({ wishlist: mappedWishlist, isLoading: false });
    } catch (err: any) {
      set({
        error: "Failed to load wishlist: " + err.message,
        isLoading: false,
      });
    }
  },

  toggleWishlist: async (
    bookDbId: string,
    userId: string,
    isCurrentlyWishlisted: boolean
  ) => {
    set({ error: null });
    try {
      if (isCurrentlyWishlisted) {
        await removeBookFromWishlist(bookDbId, userId);
        set((state) => ({
          wishlist: state.wishlist.filter((fav) => fav.book_id !== bookDbId),
        }));
      } else {
        // Add to DB
        await addBookToWishlist(bookDbId, userId);
        get().fetchWishlist(userId);
      }
    } catch (err: any) {
      console.error("Favorite toggle failed:", err.message);
      get().fetchWishlist(userId);
      throw err;
    }
  },
}));
