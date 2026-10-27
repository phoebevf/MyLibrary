"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HeartCrack, Heart, X } from "lucide-react";
import { useAuthStore } from "../../../lib/store/authStore";
import { useFavoriteStore } from "../../../lib/store/favoriteStore";
import { BookCard } from "../../../components/books/BookCard";
import { getDetailedBookData } from "../../../lib/api/books";
import styles from "./FavoritesPage.module.css";
import { Favorite } from "../../../lib/types/favorite";
import { Book } from "../../../lib/types/book";

export default function FavoritesPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { favorites, isLoading, error, fetchFavorites } = useFavoriteStore();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated && user?.id) {
      fetchFavorites(user.id);
    }
  }, [isAuthenticated, authLoading, user, router, fetchFavorites]);

  if (authLoading || !user) {
    return (
      <div className={styles.statusContainer}>
        <p>Checking session status... ✨</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.statusContainer}>
        <p>
          Loading your favorite books... <Heart />{" "}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.favoritesPage}>
      <h1 className={styles.pageTitle}>
        <Heart size={24} style={{ marginRight: "10px" }} /> My Favorite Books
      </h1>
      <p className={styles.pageDescription}>
        A collection of books you have already read and loved.
      </p>

      {favorites.length === 0 ? (
        <div className={styles.emptyState}>
          <HeartCrack size={48} className={styles.emptyIcon} />
          <p>Your favorite books list is currently empty.</p>
          <button
            className={styles.browseButton}
            onClick={() => router.push("/search")}
          >
            Browse Catalog
          </button>
        </div>
      ) : (
        <div className={styles.listGrid}>
          {favorites.map((item: Favorite) => (
            <FavoriteItemCard key={item.book_id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

interface FavoriteItemCardProps {
  item: Favorite;
}

const FavoriteItemCard: React.FC<FavoriteItemCardProps> = ({ item }) => {
  const { user } = useAuthStore();
  const { toggleFavorite } = useFavoriteStore();
  const [bookDetails, setBookDetails] = useState<Book | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(true);

  // Fetch details using the OL Key
  useEffect(() => {
    const olKey = item.ol_key;
    if (!olKey) {
      setIsDetailsLoading(false);
      return;
    }

    getDetailedBookData(olKey)
      .then(setBookDetails)
      .catch((error) => console.error("Failed to fetch book data:", error))
      .finally(() => setIsDetailsLoading(false));
  }, [item.ol_key]);

  const handleRemove = async () => {
    if (user?.id) {
      await toggleFavorite(item.book_id, user.id, true);
    }
  };

  if (isDetailsLoading || !bookDetails) {
    return <div className={styles.itemLoading}>Loading book details...</div>;
  }

  const isAvailable = bookDetails.availability?.is_available || false;

  const bookForCard = {
    key: bookDetails.key || "",
    title: bookDetails.title || "Untitled Book",
    author_name: bookDetails.author_name,
    cover_i: bookDetails.cover_i,
    publishedDate: bookDetails.first_publish_year?.toString() || "N/A",
    borrowCount: bookDetails.popularity || 0,
    availability_status: "available",
  } as any;

  return (
    <div className={styles.favoriteItem}>
      <div className={styles.bookCardWrapper}>
        <BookCard book={bookForCard} variant="list" />
      </div>

      <div className={styles.removeAction}>
        {isAvailable && (
          <span className={styles.availableNotice}>Available now!</span>
        )}
        <button
          onClick={handleRemove}
          className={styles.removeButton}
          aria-label={`Remove ${bookForCard.title} from favorites`}
        >
          <X size={18} /> Remove
        </button>
      </div>
    </div>
  );
};
