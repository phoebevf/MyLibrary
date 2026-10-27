"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../../lib/store/authStore";
import { useWishlistStore } from "../../../lib/store/wishlistStore";
import { BookCard } from "../../../components/books/BookCard";
import { getDetailedBookData } from "../../../lib/api/books";
import { Book } from "../../../lib/types/book";
import { Wishlist } from "../../../lib/types/wishlist";
import { X, HeartCrack, Star } from "lucide-react";
import styles from "./WishlistPage.module.css";

export default function WishlistPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { wishlist, isLoading, error, fetchWishlist } = useWishlistStore();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
    if (isAuthenticated && user?.id) {
      fetchWishlist(user.id);
    }
  }, [isAuthenticated, authLoading, user, router, fetchWishlist]);

  if (authLoading || !user) {
    return (
      <div className={styles.statusContainer}>
        <p>Loading user session... ✨</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.statusContainer}>
        <p>Loading your wish list... 💖</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.statusContainer}>
        <p className={styles.errorMessage}>Error loading wishlist: {error}</p>
      </div>
    );
  }

  return (
    <div className={styles.wishlistPage}>
      <h1 className={styles.pageTitle}>
        <Star size={24} style={{ marginRight: "10px" }} /> My Wishlist
      </h1>
      <p className={styles.pageDescription}>
        Books you'd like to read in the future. You'll get an email notification
        when a borrowed book on this list becomes available!
      </p>

      {wishlist.length === 0 ? (
        <div className={styles.emptyState}>
          <HeartCrack size={48} className={styles.emptyIcon} />
          <p>Your wishlist is empty. Browse the catalog to add some books!</p>
          <button
            className={styles.browseButton}
            onClick={() => router.push("/search")}
          >
            Browse Catalog
          </button>
        </div>
      ) : (
        <div className={styles.listGrid}>
          {wishlist.map((item: Wishlist) => (
            <WishlistItemCard key={item.book_id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

interface WishlistItemCardProps {
  item: Wishlist;
}

const WishlistItemCard: React.FC<WishlistItemCardProps> = ({ item }) => {
  const { user } = useAuthStore();
  const { toggleWishlist } = useWishlistStore();
  const [bookDetails, setBookDetails] = useState<Book | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(true);

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
      await toggleWishlist(item.book_id, user.id, true);
    }
  };

  if (isDetailsLoading || !bookDetails) {
    return (
      <div className={styles.wishlistItemLoading}>
        <p>Loading book details...</p>
      </div>
    );
  }

  const isAvailable = bookDetails.availability?.is_available || false;

  const bookForCard = {
    key: bookDetails.key || "",
    title: bookDetails.title || "Untitled Book",
    author_name: bookDetails.author_name,
    cover_i: bookDetails.cover_i,
    publishedDate: bookDetails.first_publish_year?.toString() || "N/A",
    borrowCount: bookDetails.popularity || 0,
    popularity: bookDetails.popularity || 0,
    availability_status: "available",
  } as any;

  return (
    <div className={styles.wishlistItem}>
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
          aria-label={`Remove ${bookForCard.title} from wishlist`}
        >
          <X size={18} /> Remove
        </button>
      </div>
    </div>
  );
};
