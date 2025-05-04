/**
 * Validates login form data
 * @param {Object} formData - The login form data
 * @param {string} formData.email - User's email
 * @param {string} formData.password - User's password
 * @returns {Object} Object containing isValid flag and errors object
 */
export const validateLoginForm = (formData) => {
  const errors = {};
  
  // Email validation
  if (!formData.email) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  // Password validation
  if (!formData.password) {
    errors.password = 'Password is required';
  } else if (formData.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validates signup form data
 * @param {Object} formData - The signup form data
 * @param {string} formData.name - User's full name
 * @param {string} formData.username - User's username
 * @param {string} formData.email - User's email
 * @param {string} formData.password - User's password
 * @param {string} formData.confirmPassword - Password confirmation
 * @returns {Object} Object containing isValid flag and errors object
 */
export const validateSignupForm = (formData) => {
  const errors = {};
  
  // Name validation
  if (!formData.name) {
    errors.name = 'Full name is required';
  } else if (formData.name.length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }
  
  // Username validation
  if (!formData.username) {
    errors.username = 'Username is required';
  } else if (formData.username.length < 3) {
    errors.username = 'Username must be at least 3 characters';
  } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
    errors.username = 'Username can only contain letters, numbers, and underscores';
  }
  
  // Email validation
  if (!formData.email) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  // Password validation
  if (!formData.password) {
    errors.password = 'Password is required';
  } else if (formData.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  } else if (!/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])/.test(formData.password)) {
    errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
  }
  
  // Confirm password validation
  if (!formData.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Helper function to validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if email is valid
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};