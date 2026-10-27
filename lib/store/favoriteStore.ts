import { create } from "zustand";
import { Favorite } from "../types/favorite";
import {
  fetchUserFavorites,
  addBookToFavorites,
  removeBookFromFavorites,
} from "../api/favorites";

interface FavoriteState {
  favorites: Favorite[];
  isLoading: boolean;
  error: string | null;
  fetchFavorites: (userId: string) => Promise<void>;
  toggleFavorite: (
    bookDbId: string,
    userId: string,
    isCurrentlyFavorited: boolean
  ) => Promise<void>;
}

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  favorites: [],
  isLoading: false,
  error: null,

  fetchFavorites: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchUserFavorites(userId);

      const mappedFavorites: Favorite[] = (data || []).map((item: any) => {
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
          added_at: item.added_at,
          books: item.books,
          ol_key: olKey,
        };
      });

      set({ favorites: mappedFavorites, isLoading: false });
    } catch (err: any) {
      set({
        error: "Failed to load favorites: " + err.message,
        isLoading: false,
      });
    }
  },

  toggleFavorite: async (
    bookDbId: string,
    userId: string,
    isCurrentlyFavorited: boolean
  ) => {
    set({ error: null });
    try {
      if (isCurrentlyFavorited) {
        await removeBookFromFavorites(bookDbId, userId);
        set((state) => ({
          favorites: state.favorites.filter((fav) => fav.book_id !== bookDbId),
        }));
      } else {
        // Add to DB
        await addBookToFavorites(bookDbId, userId);
        get().fetchFavorites(userId);
      }
    } catch (err: any) {
      console.error("Favorite toggle failed:", err.message);
      get().fetchFavorites(userId);
      throw err;
    }
  },
}));
