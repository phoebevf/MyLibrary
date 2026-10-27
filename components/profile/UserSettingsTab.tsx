'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase/client';
import styles from '../../app/(main)/profile/ProfilePage.module.css';

interface UserSettingsProps {
  userId: string;
  currentUsername: string;
  currentEmail: string;
  onUpdateSuccess: () => void;
  onLogout: () => void;
}

export default function UserSettingsTab({ userId, currentUsername, currentEmail, onUpdateSuccess, onLogout }: UserSettingsProps) {
  const [newUsername, setNewUsername] = useState(currentUsername);
  const [status, setStatus] = useState({ message: '', type: '' });
  const [loading, setLoading] = useState(false);

  const handleUsernameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ message: '', type: '' });
    setLoading(true);

    if (newUsername.length < 5 || newUsername === currentUsername) {
        setStatus({ message: 'Username must be new and at least 5 characters.', type: 'error' });
        setLoading(false);
        return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: newUsername })
        .eq('id', userId);

      if (error) throw error;
      
      setStatus({ message: 'Username updated successfully!', type: 'success' });
      onUpdateSuccess(); 
    } catch (err: any) {
      setStatus({ message: err.message || 'Failed to update username.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className={styles.settingsSection}>
      <h3 className={styles.sectionTitle}>Profile Details</h3>
      
      {status.message && (
        <p className={status.type === 'error' ? styles.errorMsg : styles.successMsg}>
          {status.message}
        </p>
      )}

      <form onSubmit={handleUsernameUpdate} className={styles.formGroup}>
        <label htmlFor="username" className={styles.formLabel}>Username</label>
        <div className={styles.inputGroup}>
            <input
                id="username"
                name="username"
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                minLength={5}
                required
                className={styles.formInput}
            />
            <button type="submit" disabled={loading} className={styles.updateButton}>
                {loading ? 'Updating...' : 'Update Username'}
            </button>
        </div>
      </form>
      
      <div className={styles.emailSection}>
        <p className={styles.emailWarning}>
          Supabase feature to add (Currently: {currentEmail})
        </p>
      </div>

      <div className={styles.logoutContainer}>
        <h3 className={styles.sectionTitle}>Account Actions</h3>
        <button onClick={onLogout} className={styles.logoutButton}>
          Log Out
        </button>
      </div>
    </div>
  );
}
