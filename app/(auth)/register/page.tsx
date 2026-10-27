"use client";

import Link from 'next/link';
import { signUp } from '../../../lib/api/auth';
import useRegisterForm from '../../../hooks/useRegisterForm'; 
import styles from './register.module.css';

export default function RegisterPage() {
  const {
    formData,
    errors,
    loading,
    submitError,
    updateField,
    validateForm,
    setLoading,
    setSubmitError,
    setFormData
  } = useRegisterForm();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSubmitError('');

    try {
      await signUp(formData.email, formData.password, formData.username);
      
      setSubmitError('Registration successful! Please check your email to activate your account.');
      setFormData({
        email: '',
        username: '',
        password: '',
        confirmPassword: ''
      });
    } catch (err: any) {
      setSubmitError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
        <div className={styles.authForm}>
            <h1 className={styles.logo}>MyLibrary</h1>
            <h2 className={styles.formTitle}>Create Account</h2>

            {submitError && (
                <div className={`${styles.message} ${submitError.includes('successful') ? styles.success : styles.error}`}>
                    {submitError}
                </div>
            )}

            <form onSubmit={handleRegister} className={styles.form}>
                
                <div className={styles.inputGroup}>
                    <label htmlFor="email" className={styles.label}>Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className={styles.inputField}
                      required
                      autoComplete="email"
                    />
                    {errors.email && <p className={styles.errorText}>{errors.email}</p>}
                </div>
                
                <div className={styles.inputGroup}>
                    <label htmlFor="username" className={styles.label}>Username</label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      placeholder="Choose your username"
                      value={formData.username}
                      onChange={(e) => updateField('username', e.target.value)}
                      className={styles.inputField}
                      required
                      autoComplete="username"
                    />
                    {errors.username && <p className={styles.errorText}>{errors.username}</p>}
                </div>
                
                <div className={styles.inputGroup}>
                    <label htmlFor="password" className={styles.label}>Password</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      placeholder="Create your password"
                      value={formData.password}
                      onChange={(e) => updateField('password', e.target.value)}
                      className={styles.inputField}
                      required
                      autoComplete="new-password"
                    />
                    {errors.password && <p className={styles.errorText}>{errors.password}</p>}
                </div>
                
                <div className={styles.inputGroup}>
                    <label htmlFor="confirmPassword" className={styles.label}>Confirm Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => updateField('confirmPassword', e.target.value)}
                      className={styles.inputField}
                      required
                      autoComplete="new-password"
                    />
                    {errors.confirmPassword && <p className={styles.errorText}>{errors.confirmPassword}</p>}
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className={styles.submitButton}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
            </form>

            <p className={styles.authLink}>
                Already have an account?{' '}
                <Link href="/login" className={styles.link}>
                  Sign In
                </Link>
            </p>
        </div>
    </div>
  );
}
