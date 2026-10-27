'use client';

import { Book } from '../../lib/types/book';
import { BookCard } from './BookCard';
import styles from './BookList.module.css';

interface BookListProps {
  books: Book[];
  loading?: boolean;
  variant?: 'grid' | 'list';
  emptyMessage?: string;
}

export const BookList: React.FC<BookListProps> = ({
  books,
  loading = false,
  variant = 'grid',
  emptyMessage = 'No books found',
}) => {
  const isGrid = variant === 'grid';
  const containerClass = isGrid ? styles.gridContainer : styles.listContainer;

  if (loading) {
    return (
      <div className={`${containerClass} ${styles.loadingGrid}`}>
        {Array.from({ length: 12 }).map((_, index) => ( 
          <BookCardSkeleton key={index} variant={variant} />
        ))}
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📚</div>
        <h3 className={styles.emptyTitle}>
          {emptyMessage}
        </h3>
        <p className={styles.emptyDescription}>
          Try adjusting your search filters.
        </p>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      {books.map((book) => (
        <BookCard
          key={(book as any).key} 
          book={book as any} 
          variant={variant}
        />
      ))}
    </div>
  );
};

const BookCardSkeleton: React.FC<{ variant: 'grid' | 'list' }> = ({ variant }) => {
  if (variant === 'grid') {
    return (
      <div className={`${styles.skeletonGrid} ${styles.skeletonBase}`}>
        <div className={styles.skeletonImage} />
        <div className={styles.skeletonContent}>
          <div className={`${styles.skeletonLine} ${styles.lineShort}`} />
          <div className={styles.skeletonLine} />
          <div className={`${styles.skeletonLine} ${styles.lineMedium}`} />
          <div className={styles.skeletonTags}>
            <div className={`${styles.skeletonTag} ${styles.tagSmall}`} />
            <div className={`${styles.skeletonTag} ${styles.tagExtraSmall}`} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.skeletonList} ${styles.skeletonBase}`}>
      <div className={styles.skeletonListImage} />
      <div className={styles.skeletonContentList}>
        <div className={`${styles.skeletonLine} ${styles.lineLarge}`} />
        <div className={`${styles.skeletonLine} ${styles.lineShort}`} />
        <div className={styles.skeletonLine} />
        <div className={`${styles.skeletonLine} ${styles.lineMedium}`} />
        <div className={styles.skeletonTags}>
          <div className={`${styles.skeletonTag} ${styles.tagLarge}`} />
          <div className={`${styles.skeletonTag} ${styles.tagMedium}`} />
        </div>
      </div>
    </div>
  );
};
