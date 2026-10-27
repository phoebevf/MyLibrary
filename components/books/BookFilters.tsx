"use client";

import { BookSearchParams } from "../../lib/types/book";
import styles from ".//BookFilters.module.css";
import { Star, TrendingUp, Clock, Type } from "lucide-react";

interface BookFiltersProps {
  searchParams: BookSearchParams;
  onFilterChange: (params: Partial<BookSearchParams>) => void;
}

// Subject list from Open Library categories
const subjects = [
  "All",
  "Fiction",
  "Science",
  "History",
  "Art",
  "Business & Finance",
  "Children's",
  "Biography",
  "Social Sciences",
  "Technology",
];

export const BookFilters: React.FC<BookFiltersProps> = ({
  searchParams,
  onFilterChange,
}) => {
  const sortOptions = [
    { value: "popularity", label: "Popularity", icon: TrendingUp },
    { value: "publishedDate", label: "Year (Oldest)", icon: Clock },
    { value: "newest", label: "Year (Newest)", icon: Clock },
    { value: "author", label: "Author", icon: Type },
    { value: "title", label: "Title", icon: Type },
  ];

  return (
    <div className={styles.filtersContainer}>
      <div className={styles.filterGroup}>
        <label htmlFor="subject-select" className={styles.filterLabel}>
          Category:
        </label>
        <select
          id="subject-select"
          value={searchParams.subject || "All"}
          onChange={(e) =>
            onFilterChange({ subject: e.target.value, query: "" })
          }
          className={styles.selectInput}
        >
          {subjects.map((subject) => (
            <option key={subject} value={subject === "All" ? "" : subject}>
              {subject}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.filterGroup}>
        <label htmlFor="sort-by-select" className={styles.filterLabel}>
          Sort by:
        </label>
        <select
          id="sort-by-select"
          value={searchParams.sortBy || "popularity"}
          onChange={(e) =>
            onFilterChange({
              sortBy: e.target.value as BookSearchParams["sortBy"],
              sortOrder:
                e.target.value === "publishedDate"
                  ? "asc"
                  : e.target.value === "newest"
                  ? "desc"
                  : searchParams.sortOrder,
            })
          }
          className={styles.selectInput}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
