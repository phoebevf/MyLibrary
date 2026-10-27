'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react'; 
import styles from './BookSearch.module.css'; 

interface BookSearchProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
  placeholder?: string;
}

export const BookSearch: React.FC<BookSearchProps> = ({
  onSearch,
  initialQuery = '',
  placeholder = 'Search books by title, author, or keyword...'
}) => {
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query.trim()); 
  };

  const handleClear = () => {
    setQuery('');
    onSearch(''); 
  };

  return (
    <form onSubmit={handleSubmit} className={styles.searchForm}>
      <div className={styles.inputContainer}>
        <div className={styles.iconContainer}>
          <Search size={20} className={styles.searchIcon} />
        </div>
        
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className={styles.searchInput}
        />
        
        <div className={styles.buttonGroup}>
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className={styles.clearButton}
              aria-label="Clear search input"
            >
              <X size={16} />
            </button>
          )}
          
          <button
            type="submit"
            disabled={!query.trim()}
            className={styles.submitButton}
          >
            Search
          </button>
        </div>
      </div>
    </form>
  );
};
