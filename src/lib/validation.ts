/**
 * Input validation utilities for form data
 */

export interface ValidationError {
  field: string;
  message: string;
}

export function validatePainLevel(value: number): ValidationError | null {
  if (typeof value !== 'number' || value < 0 || value > 10 || !Number.isInteger(value)) {
    return { field: 'pain_level', message: 'Pain level must be an integer between 0 and 10' };
  }
  return null;
}

export function validateSeverity(value: number): ValidationError | null {
  if (typeof value !== 'number' || value < 0 || value > 10 || !Number.isInteger(value)) {
    return { field: 'severity', message: 'Severity must be an integer between 0 and 10' };
  }
  return null;
}

export function validateRating(value: number, min = 1, max = 5): ValidationError | null {
  if (typeof value !== 'number' || value < min || value > max || !Number.isInteger(value)) {
    return { field: 'rating', message: `Rating must be an integer between ${min} and ${max}` };
  }
  return null;
}

export function validateEmail(email: string): ValidationError | null {
  const trimmed = email.trim();
  if (!trimmed) return null; // Email is optional

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { field: 'email', message: 'Please enter a valid email address' };
  }

  if (trimmed.length > 254) {
    return { field: 'email', message: 'Email address is too long' };
  }

  return null;
}

export function validateClientName(name: string): ValidationError | null {
  const trimmed = name.trim();

  if (!trimmed) {
    return { field: 'full_name', message: 'Client name is required' };
  }

  if (trimmed.length < 2) {
    return { field: 'full_name', message: 'Client name must be at least 2 characters' };
  }

  if (trimmed.length > 100) {
    return { field: 'full_name', message: 'Client name must not exceed 100 characters' };
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
    return { field: 'full_name', message: 'Client name can only contain letters, spaces, hyphens, and apostrophes' };
  }

  return null;
}

export function validateLoginCode(code: string): ValidationError | null {
  const trimmed = code.trim();

  if (!trimmed) {
    return { field: 'login_code', message: 'Login code is required' };
  }

  // Should be 4 digits
  if (!/^\d{4}$/.test(trimmed)) {
    return { field: 'login_code', message: 'Login code must be exactly 4 digits' };
  }

  return null;
}

export function validatePassword(password: string): ValidationError | null {
  if (!password) {
    return { field: 'password', message: 'Password is required' };
  }

  if (password.length < 6) {
    return { field: 'password', message: 'Password must be at least 6 characters' };
  }

  if (password.length > 128) {
    return { field: 'password', message: 'Password must not exceed 128 characters' };
  }

  return null;
}

export function validateCheckInData(data: {
  pain_level?: number;
  sleep_quality?: number;
  stress_level?: number;
  overall_feeling?: number;
}): ValidationError[] {
  const errors: ValidationError[] = [];

  if (data.pain_level !== undefined) {
    const error = validatePainLevel(data.pain_level);
    if (error) errors.push(error);
  }

  if (data.sleep_quality !== undefined) {
    const error = validateRating(data.sleep_quality, 1, 5);
    if (error) {
      error.field = 'sleep_quality';
      error.message = 'Sleep quality must be rated 1-5';
      errors.push(error);
    }
  }

  if (data.stress_level !== undefined) {
    const error = validateRating(data.stress_level, 1, 5);
    if (error) {
      error.field = 'stress_level';
      error.message = 'Stress level must be rated 1-5';
      errors.push(error);
    }
  }

  if (data.overall_feeling !== undefined) {
    const error = validateRating(data.overall_feeling, 1, 5);
    if (error) {
      error.field = 'overall_feeling';
      error.message = 'Overall feeling must be rated 1-5';
      errors.push(error);
    }
  }

  return errors;
}
