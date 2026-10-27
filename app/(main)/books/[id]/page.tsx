"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Heart, BookOpen, Share2, Star } from "lucide-react";
import {
  getDetailedBookData,
  getBookCoverUrl,
} from "../../../../lib/api/books";
import { Book } from "../../../../lib/types/book";
import { useAuthStore } from "../../../../lib/store/authStore";
import { useWishlistStore } from "../../../../lib/store/wishlistStore";
import { useFavoriteStore } from "../../../../lib/store/favoriteStore";
import { requestLoan, hasActiveOrPendingLoan } from "../../../../lib/api/loans"; 
import styles from "./BookDetailPage.module.css";

const shareBook = (title: string, url: string) => {
  if (navigator.share) {
    navigator
      .share({
        title: title,
        url: url,
      })
      .catch(console.error);
  } else {
    navigator.clipboard.writeText(url);
    alert(`Link copied to clipboard! Share: ${url}`);
  }
};

export default function BookDetailPage() {
  const params = useParams();
  const workKey = params.id as string;
  const router = useRouter();

  const { user, isAuthenticated } = useAuthStore();
  const { wishlist, fetchWishlist, toggleWishlist} = useWishlistStore();
  const { favorites, fetchFavorites, toggleFavorite } = useFavoriteStore();

  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestStatus, setRequestStatus] = useState<string | null>(null); 

  const isWishlisted = wishlist.some((item) => item.book_id === book?.db_id);
  const isFavorited = favorites.some((item) => item.book_id === book?.db_id);

  const handleFavoriteToggle = async () => {
    if (!isAuthenticated || !user || !book?.db_id) {
      router.push("/login");
      return;
    }
    try {
      await toggleFavorite(book.db_id, user.id, isFavorited);
      fetchFavorites(user.id); 
    } catch (err: any) {
      console.error("Favorite toggle failed:", err.message);
      alert(`Action failed: ${err.message}. Please refresh the page.`);
    }
  };

  const handleWishlistToggle = async () => {
    if (!isAuthenticated || !user || !book?.db_id) {
      router.push("/login");
      return;
    }
     try {
      await toggleWishlist(book.db_id, user.id, isFavorited);
      fetchFavorites(user.id); 
    } catch (err: any) {
      console.error("Favorite toggle failed:", err.message);
      alert(`Action failed: ${err.message}. Please refresh the page.`);
    }
  };

  useEffect(() => {
    if (!workKey) {
      setError("Book ID is missing.");
      setIsLoading(false);
      return;
    }

    const fetchBook = async () => {
      try {
        const fullKey = workKey.includes("/")
          ? workKey.split("/").pop()!
          : workKey;
        const bookData = await getDetailedBookData(fullKey);
        setBook(bookData);
        if (isAuthenticated && user?.id) {
          fetchWishlist(user.id);
          fetchFavorites(user.id);
        }
      } catch (err: any) {
        setError(
          "Failed to load book details: " + (err.message || "Network error")
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchBook();
  }, [workKey, isAuthenticated, user?.id, fetchWishlist, fetchFavorites]);

  const handleLoan = async () => {
    if (!isAuthenticated || !user || !book?.db_id) {
      router.push("/login");
      return;
    }
    
    try {
        const alreadyRequested = await hasActiveOrPendingLoan(book.db_id, user.id);
        
        if (alreadyRequested) {
            setRequestStatus("You already have an active loan or a pending request for this book.");
            return;
        }
    } catch (e) {
        setRequestStatus("Error checking loan status. Please try again.");
        return;
    }

    if (book.available_copies === 0) { 
      setRequestStatus("This book is currently out of stock. Request cannot be placed.");
      return;
    }

    try {
      const result = await requestLoan(book.db_id, user.id); 
      setRequestStatus(
        `Loan request sent successfully! Your pickup code is: ${result.code}.`
      );
    } catch (err: any) {
      setRequestStatus(err.message || "Failed to process loan request. You may have a pending request already.");
    }
  };

  if (isLoading) {
    return (
      <div className={styles.statusContainer}>
        <p>Loading book details... 📖</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.statusContainer}>
        <p className={styles.errorMessage}>{error}</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className={styles.statusContainer}>
        <p>Book details not found.</p>
      </div>
    );
  }

  const coverUrl = book.cover_i
    ? getBookCoverUrl(book.cover_i, "L")
    : "/images/book-placeholder.jpg";
  const isAvailable = (book.available_copies || 0) > 0; 
  const statusLabel = isAvailable ? "Available for Request" : "Fully Borrowed";
  const statusClass = isAvailable
    ? styles.statusAvailable
    : styles.statusBorrowed;

  return (
    <div className={styles.detailPage}>
      <div className={styles.contentGrid}>
        <div className={styles.leftColumn}>
          <div className={styles.coverWrapper}>
            <Image
              src={coverUrl}
              alt={`Cover of ${book.title}`}
              fill
              className={styles.coverImage}
              priority
            />
          </div>

          <div className={styles.actionButtons}>
            <button
              onClick={handleLoan}
              disabled={!isAuthenticated} 
              className={`${styles.mainActionButton} ${
                isAvailable ? "" : styles.disabledAction
              }`}
            >
              <BookOpen size={20} />
              {isAvailable ? "Request Loan" : "Queue Full/Out of Stock"}
            </button>

            <button
              onClick={handleFavoriteToggle}
              className={`${styles.secondaryActionButton} ${isFavorited ? styles.favorited : ''}`}
            >
              <Heart size={20} />
              {isFavorited ? "My Favorite" : "Add to Favorites"}
            </button>

            <button
              onClick={handleWishlistToggle}
              className={`${styles.secondaryActionButton} ${
                isWishlisted ? styles.wishlisted : ""
              }`}
            >
              <Star size={20} />
              {isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
            </button>

            <button
              onClick={() => shareBook(book.title, window.location.href)}
              className={styles.secondaryActionButton}
            >
              <Share2 size={20} />
              Share Link
            </button>
          </div>
          {requestStatus && (
            <p className={styles.borrowMessage}>{requestStatus}</p>
          )}
        </div>

        <div className={styles.rightColumn}>
          <h1 className={styles.title}>{book.title}</h1>
          <p className={styles.author}>
            by {book.author_name?.join(", ") || "Unknown Author"}
          </p>

          <div className={styles.metadataBlock}>
            <span className={statusClass}>Status: {statusLabel}</span>
            <span className={styles.metadataItem}>
              Copies: {book.available_copies || 0}
            </span>
            <span className={styles.metadataItem}>
              Popularity: {book.popularity || 0} 📊
            </span>
            {book.availability?.due_date && (
              <span className={styles.metadataItem}>
                Due: {new Date(book.availability.due_date).toLocaleDateString()}
              </span>
            )}
          </div>

          <h2 className={styles.sectionHeading}>Description</h2>
          <p className={styles.description}>{book.description}</p>

          <h2 className={styles.sectionHeading}>Subjects/Genres</h2>
          <div className={styles.tagContainer}>
            {book.subject?.slice(0, 8).map((subject, index) => (
              <span key={index} className={styles.tag}>
                {subject}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
