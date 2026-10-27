'use client';

import Link from 'next/link';
import { useAuthStore } from '../../lib/store/authStore';
import { useState, useEffect } from 'react';
import { fetchPopularBooks } from '../../lib/api/books'; 
import { BookCard } from '../../components/books/BookCard';
import styles from './LandingPage.module.css';

export default function LandingPage() {
    const { isAuthenticated } = useAuthStore();
    const [popularBooks, setPopularBooks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPopularBooks(12).then(data => { 
            setPopularBooks(data);
            setLoading(false);
        });
    }, []);
    
    return (
        <div className={styles.landingPage}>
            <header className={styles.heroSection}>
                <div className={styles.heroContent}>
                    <span className={styles.heroTitleCursive}>
                        Welcome to
                    </span>
                    <h1 className={styles.heroTitleMain}>
                        Library Catalog
                    </h1>
                    
                    <p className={styles.heroDescription}>
                        Your digital gateway to exploring and requesting thousands of books. 
                        Sign in to manage your loans, track due dates, and build your perfect reading list.
                    </p>
                
                    <div className={styles.ctaContainer}>
                        {isAuthenticated ? (
                            <Link href="/search" className={styles.ctaButtonPrimary}>
                                View Full Catalog
                            </Link>
                        ) : (
                            <>
                                <Link href="/register" className={styles.ctaButtonPrimary}>
                                    Join MyLibrary
                                </Link>
                                <Link href="/login" className={styles.ctaButtonSecondary}>
                                    Member Sign In
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <section className={styles.recommendationSection}>
                <h3 className={styles.sectionTitle}>
                    Top Picks: Most Popular Selections
                </h3>
                {loading ? (
                    <p className={styles.statusMessage}>Loading top selections...</p>
                ) : (
                    <div className={styles.bookGrid}>
                        {popularBooks.map(book => (
                            <BookCard key={book.db_id} book={book} variant="grid" /> 
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
