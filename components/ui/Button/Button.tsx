import { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: 'primary' | 'secondary';
}

export default function Button({ 
  loading, 
  children, 
  disabled, 
  variant = 'primary',
  className = '',
  ...props 
}: ButtonProps) {
  return (
    <button
      className={`${styles.button} ${styles[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className={styles.loadingContent}>
          <span className={styles.spinner}>✨</span>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
