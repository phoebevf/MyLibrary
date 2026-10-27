'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { BookList } from '../../../components/books/BookList';
import { BookFilters } from '../../../components/books/BookFilters';
import { useBookStore } from '../../../lib/store/bookStore';
import { BookSearchParams } from '../../../lib/types/book'
import styles from './SearchPage.module.css'; 

const BOOKS_PER_PAGE = 12;

export default function SearchAndCatalogPage() {
  const { books, isLoading, error, triggerSearch } = useBookStore(); 
  
  const [searchParams, setSearchParams] = useState<BookSearchParams>({
    query: '', 
    limit: BOOKS_PER_PAGE, 
    offset: 0,           
    sortBy: 'popularity', 
    sortOrder: 'desc', 
    subject: 'All', 
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState(''); 
  
  useEffect(() => {
    const newOffset = (currentPage - 1) * BOOKS_PER_PAGE;
    
    let finalQuery = searchParams.query || '';
    
    if (!finalQuery && searchParams.subject && searchParams.subject !== 'All') {
        finalQuery = searchParams.subject;
    }

    const fetchParams = {
        ...searchParams,
        query: finalQuery, 
        offset: newOffset,
        limit: BOOKS_PER_PAGE,
    };

    triggerSearch(fetchParams);
    
    if (searchParams.offset !== newOffset) {
         setSearchParams(prev => ({ ...prev, offset: newOffset }));
    }
    
  }, [searchParams.query, searchParams.sortBy, searchParams.subject, searchParams.sortOrder, currentPage, triggerSearch]); 

  useEffect(() => {
      triggerSearch({ query: 'fiction', limit: BOOKS_PER_PAGE, offset: 0, sortBy: 'popularity' });
  }, [triggerSearch]);


  const handleTextSearch = useCallback(() => {
    // This is called when the user hits ENTER or clicks search in the BookSearch component
    const newParams: BookSearchParams = { 
        ...searchParams, 
        query: searchTerm, 
        offset: 0, // Reset pagination
    };
    setSearchParams(newParams);
    setCurrentPage(1); 
  }, [searchParams, searchTerm]);


  const handleFilterChange = useCallback((newParams: Partial<BookSearchParams>) => {
    const updatedParams: BookSearchParams = { 
        ...searchParams, 
        ...newParams,
        offset: 0, // Reset pagination on filter change
    };
    setSearchParams(updatedParams);
    setCurrentPage(1); // Reset page number
  }, [searchParams]);


  const handleNextPage = useCallback(() => {
    setCurrentPage((prevPage) => prevPage + 1);
  }, []);

  const handlePrevPage = useCallback(() => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  }, []);

  // Determine the display variant (List if searching/filtering, Grid otherwise)
  const listVariant = useMemo(() => {
    // List view when an explicit filter or search is active
    return searchParams.query || searchParams.subject !== 'All' ? 'list' : 'grid';
  }, [searchParams.query, searchParams.subject]);


  return (
    <div className={styles.searchPage}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.pageTitle}>Library Catalog</h1>
          <p className={styles.pageSubtitle}>Search thousands of titles, filter by subject, and discover new books.</p>
        </header>
        
        <div className={styles.searchBarContainer}>
          <input 
            type="text" 
            placeholder="Search title, author, keywords"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyUp={(e) => { if (e.key === 'Enter') handleTextSearch(); }}
            className={styles.searchInput}
          />
          <button onClick={handleTextSearch} className={styles.searchButton}>Search</button>
        </div>

        <div className={styles.filtersContainer}>
          <BookFilters
            searchParams={searchParams}
            onFilterChange={handleFilterChange}
          />
        </div>

        <div className={styles.resultsContainer}>
          <div className={styles.resultsHeader}>
            <h2 className={styles.resultsTitle}>
              {searchParams.query ? `Results for "${searchParams.query}"` : 'Popular Selections'}
            </h2>
            <span className={styles.resultsCount}>
            </span>
          </div>

          {error && (<div className={styles.errorMessage}>{error}</div>)}

          <BookList
            books={books}
            loading={isLoading}
            variant={listVariant}
            emptyMessage={
              searchParams.query || searchParams.subject !== 'All'
                ? 'No books found matching your search or filters.'
                : 'No popular books are available at this moment.'
            }
          />
        </div>

        <div className={styles.paginationControls}>
          <button 
            onClick={handlePrevPage} 
            disabled={currentPage === 1}
            className={styles.paginationButton}
          >
            Previous Page
          </button>
          <span className={styles.pageIndicator}>Page {currentPage}</span>
          <button 
            onClick={handleNextPage} 
            disabled={!isLoading && books.length < BOOKS_PER_PAGE} 
            className={styles.paginationButton}
          >
            Next Page
          </button>
        </div>
      </div>
    </div>
  );
}
