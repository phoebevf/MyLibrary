"use client";

import { useState, useEffect } from 'react'; 
import Link from 'next/link';
import { signIn } from '../../../lib/api/auth';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/authStore';
import styles from './login.module.css'; 

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore(); 

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/'); 
    }
  }, [isAuthenticated, isLoading, router]); 

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please enter both email and password.');
      setLoading(false);
      return;
    }

    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || isAuthenticated) {
    return <div className={styles.authForm}>Checking session...</div>;
  }

  return (
    <div className={styles.authContainer}>
        <div className={styles.authForm}>
            <h1 className={styles.logo}>MyLibrary</h1>
            <h2 className={styles.formTitle}>Member Login</h2>
            
            <form onSubmit={handleLogin} className={styles.form}>
                {error && (
                    <div className={`${styles.message} ${styles.error}`}>
                        {error}
                    </div>
                )}
                
                <input
                    type="email"
                    name="email"
                    id="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.inputField}
                    required
                />
                <input
                    type="password"
                    name="password"
                    id="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={styles.inputField}
                    required
                />
                <button type="submit" disabled={loading} className={styles.submitButton}>
                    {loading ? 'Authenticating...' : 'Login'}
                </button>
            </form>
            
            <p className={styles.authLink}>
                Don't have an account?{' '}
                <Link href="/register" className={styles.link}>
                    Create Account
                </Link>
            </p>
        </div>
    </div>
  );
}
