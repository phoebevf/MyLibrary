'use client';

import React, { useState, useEffect } from 'react';
import { Loader } from 'lucide-react';
import styles from './ConfirmationModal.module.css'; 

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel: string;
  isLoading: boolean;
  countdownSeconds?: number;
  content?: React.ReactNode; 
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  isLoading,
  countdownSeconds = 0,
  content, 
}) => {
  const [countdown, setCountdown] = useState(countdownSeconds);
  const [isConfirmEnabled, setIsConfirmEnabled] = useState(countdownSeconds === 0);

  useEffect(() => {
    if (!isOpen || countdownSeconds === 0) return;
    setCountdown(countdownSeconds);
    setIsConfirmEnabled(false);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsConfirmEnabled(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, countdownSeconds]);
  
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (isConfirmEnabled && !isLoading) {
      onConfirm();
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2 className={styles.modalTitle}>{title}</h2>
        <p className={styles.modalMessage}>{message}</p>
        
        {content && <div className={styles.customContentArea}>{content}</div>}

        <div className={styles.buttonGroup}>
          <button 
            onClick={onClose} 
            className={styles.cancelButton}
            disabled={isLoading}
          >
            Cancel
          </button>
          
          <button 
            onClick={handleConfirm} 
            className={`${styles.confirmButton} ${!isConfirmEnabled ? styles.disabled : ''}`}
            disabled={!isConfirmEnabled || isLoading}
          >
            {isLoading ? (
                <>
                    <Loader size={16} className={styles.spinner} /> Processing...
                </>
            ) : (
                <>
                    {confirmLabel}
                    {countdownSeconds > 0 && countdown > 0 && (
                        <span className={styles.countdown}>{countdown}s</span>
                    )}
                </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
