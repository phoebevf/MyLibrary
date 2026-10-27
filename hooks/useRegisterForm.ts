import { useState } from 'react';
import { 
  validateEmail, 
  validateUsername, 
  validatePassword, 
  validateConfirmPassword 
} from '../lib/utils/validation';

interface FormData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  email?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
}

export default function useRegisterForm() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<keyof FormData, boolean>>({
    email: false,
    username: false,
    password: false,
    confirmPassword: false
  });
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Real-time validation when user has touched the field
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const handleBlur = (field: keyof FormData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
    
    if (submitError) {
      setSubmitError('');
    }
  };

  const validateField = (field: keyof FormData, value: string) => {
    let validationResult: { isValid: boolean; message: string };
    
    switch (field) {
      case 'email':
        validationResult = validateEmail(value);
        break;
      case 'username':
        validationResult = validateUsername(value);
        break;
      case 'password':
        validationResult = validatePassword(value);
        break;
      case 'confirmPassword':
        validationResult = validateConfirmPassword(formData.password, value);
        break;
      default:
        return;
    }

    setErrors(prev => ({
      ...prev,
      [field]: validationResult.isValid ? undefined : validationResult.message
    }));
  };

  const validateForm = (): boolean => {
    setTouched({
      email: true,
      username: true,
      password: true,
      confirmPassword: true
    });

    const newErrors: FormErrors = {};

    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) newErrors.email = emailValidation.message;

    const usernameValidation = validateUsername(formData.username);
    if (!usernameValidation.isValid) newErrors.username = usernameValidation.message;

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) newErrors.password = passwordValidation.message;

    const confirmPasswordValidation = validateConfirmPassword(formData.password, formData.confirmPassword);
    if (!confirmPasswordValidation.isValid) newErrors.confirmPassword = confirmPasswordValidation.message;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return {
    formData,
    errors,
    loading,
    submitError,
    updateField,
    handleBlur,
    validateForm,
    setLoading,
    setSubmitError,
    setFormData
  };
}
