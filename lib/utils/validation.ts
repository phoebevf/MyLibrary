export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/;

export interface ValidationResult {
  isValid: boolean;
  message: string;
}

export const validateUsername = (username: string): ValidationResult => {
  if (!username.trim()) {
    return { isValid: false, message: 'Username is required' };
  }
  
  if (username.length < 3) {
    return { isValid: false, message: 'Username must be at least 3 characters' };
  }
  
  if (username.length > 20) {
    return { isValid: false, message: 'Username must be less than 20 characters' };
  }
  
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(username)) {
    return { isValid: false, message: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }
  
  return { isValid: true, message: '' };
};

export const validateEmail = (email: string): ValidationResult => {
  if (!email.trim()) {
    return { isValid: false, message: 'Email is required' };
  }

  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Please enter a valid email address.' };
  }

  const parts = email.split('@');
  if (parts[0].length > 64) {
    return { isValid: false, message: 'Email username too long' };
  }

  return { isValid: true, message: '' };
};


export const validatePassword = (password: string): ValidationResult => {
  if (!password.trim()) {
    return { isValid: false, message: 'Password is required' };
  }

  if (!passwordRegex.test(password)) {
    return { 
      isValid: false, 
      message: 'Password must be at least 8 characters long and at least contain an uppercase letter, a lowercase letter, a special character and a number.' 
    };
  }

  const weakPasswords = ['password', '12345678', 'qwertyui', 'admin123'];
  if (weakPasswords.includes(password.toLowerCase())) {
    return { isValid: false, message: 'This password is too common. Please choose a stronger one' };
  }

  return { isValid: true, message: '' };
};

export const validateConfirmPassword = (password: string, confirmPassword: string): ValidationResult => {
  if (!confirmPassword.trim()) {
    return { isValid: false, message: 'Please confirm your password' };
  }
  
  if (password !== confirmPassword) {
    return { isValid: false, message: 'Passwords do not match' };
  }
  
  return { isValid: true, message: '' };
};
