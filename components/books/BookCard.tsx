"use client";

import { Book } from "../../lib/types/book";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { getBookCoverUrl } from "../../lib/api/books";
import { Heart } from "lucide-react";
import styles from "./BookCard.module.css";
type BookAvailabilityStatus = "available" | "borrowed" | "reserved";

interface BookCardProps {
  book: Book & {
    availability_status: BookAvailabilityStatus;
    isFavorited?: boolean;
  };
  variant?: "grid" | "list";
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  variant = "grid",
}) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const coverUrl =
    book.cover_i && !imageError
      ? getBookCoverUrl(book.cover_i, variant === "grid" ? "M" : "S")
      : "/images/book-placeholder.jpg";

  const AvailabilityBadge = () => {
    const statusConfig: Record<
      BookAvailabilityStatus,
      { label: string; className: string }
    > = {
      available: { label: "Available", className: styles.badgeAvailable },
      borrowed: { label: "Borrowed", className: styles.badgeBorrowed },
      reserved: { label: "Reserved", className: styles.badgeReserved },
    };

    const statusKey = book.availability_status || "available";

    const status = statusConfig[statusKey];

    return (
      <span className={`${styles.availabilityBadge} ${status.className}`}>
        {status.label}
      </span>
    );
  };

  if (variant === "grid") {
    return (
      <Link
        href={`/books/${book.key.split("/").pop()}`}
        className={styles.cardLink}
      >
        <div className={styles.bookCardGrid}>
          <div className={styles.imageContainer}>
            {coverUrl !== "/images/book-placeholder.jpg" ? (
              <Image
                src={coverUrl}
                alt={`Cover of ${book.title}`}
                fill
                className={styles.coverImage}
                onError={handleImageError}
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                priority={false}
              />
            ) : (
              <div className={styles.placeholderContainer}>
                <div className={styles.placeholderIcon}>📚</div>
                <p className={styles.placeholderText}>No image</p>
              </div>
            )}
          </div>

          <div className={styles.infoContent}>
            <AvailabilityBadge />

            <h3 className={styles.titleGrid}>{book.title}</h3>

            <p className={styles.authorGrid}>
              {book.author_name ? book.author_name[0] : "Unknown Author"}
            </p>

            <div className={styles.metadataContainer}>
              <div className={styles.metadataRow}>
                <div className={styles.popularityContainer}>
                  {book.isFavorited && (
                    <Heart
                      size={16}
                      className={styles.favoriteIcon}
                      fill="var(--color-pink-primary)"
                      strokeWidth={0}
                    />
                  )}
                  <span className={styles.metadataCount}>
                     {book.popularity}
                  </span>
                </div>
                <span className={styles.metadataDate}>
                  published year: {book.first_publish_year}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

    return (
    <Link
      href={`/books/${book.key.split("/").pop()}`}
      className={styles.cardLink}
    >
       <div className={styles.bookCardList}>
        <div className={styles.listFlexContainer}>
          <div className={styles.listImageWrapper}>
            {coverUrl !== "/images/book-placeholder.jpg" ? (
              <Image
                src={coverUrl}
                alt={`Cover of ${book.title}`}
                fill
                className={styles.coverImage}
                onError={handleImageError}
                sizes="64px"
                priority={false}
              />
            ) : (
              <div className={styles.placeholderContainer}>
                <span className={styles.listPlaceholderIcon}></span>
              </div>
            )}
          </div>

          <div className={styles.listContent}>
            <div className={styles.listHeader}>
              <div className={styles.listTitleAuthor}>
                <h3 className={styles.titleList}>{book.title}</h3>
                <p className={styles.authorList}>
                  {book.author_name ? book.author_name[0] : "Unknown Author"}
                </p>
              </div>
              <AvailabilityBadge />
            </div>

            <div className={styles.metadataList}>
              <div className={styles.favoriteStatusList}>
                {book.isFavorited && (
                  <Heart
                    size={16}
                    className={styles.favoriteIcon}
                    fill="var(--color-pink-primary)"
                    strokeWidth={0}
                  />
                )}
              </div>
              <span className={styles.metadataDate}>
                  published year: {book.first_publish_year}
                </span>
              <div className={styles.loanPopularity}>
                <span>{book.available_copies}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
