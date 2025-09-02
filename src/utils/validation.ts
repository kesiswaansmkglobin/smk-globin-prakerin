export interface ValidationRule<T> {
  field: keyof T;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
  message?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export function validateForm<T extends Record<string, any>>(
  data: T,
  rules: ValidationRule<T>[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  rules.forEach(rule => {
    const value = data[rule.field];
    const fieldName = String(rule.field);

    // Required validation
    if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      errors.push({
        field: fieldName,
        message: rule.message || `${fieldName} wajib diisi`
      });
      return;
    }

    // Skip other validations if field is empty and not required
    if (!value) return;

    // String validations
    if (typeof value === 'string') {
      // Min length validation
      if (rule.minLength && value.length < rule.minLength) {
        errors.push({
          field: fieldName,
          message: rule.message || `${fieldName} minimal ${rule.minLength} karakter`
        });
      }

      // Max length validation
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push({
          field: fieldName,
          message: rule.message || `${fieldName} maksimal ${rule.maxLength} karakter`
        });
      }

      // Pattern validation
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push({
          field: fieldName,
          message: rule.message || `${fieldName} format tidak valid`
        });
      }
    }

    // Custom validation
    if (rule.custom && !rule.custom(value)) {
      errors.push({
        field: fieldName,
        message: rule.message || `${fieldName} tidak valid`
      });
    }
  });

  return errors;
}

// Common validation patterns
export const ValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^(\+62|62|0)[0-9]{9,13}$/,
  nis: /^[0-9]{8,10}$/,
  username: /^[a-zA-Z0-9_]{3,20}$/
};

// Helper function to create validation rules
export function createValidationRules<T>(): {
  required: (field: keyof T, message?: string) => ValidationRule<T>;
  minLength: (field: keyof T, length: number, message?: string) => ValidationRule<T>;
  maxLength: (field: keyof T, length: number, message?: string) => ValidationRule<T>;
  pattern: (field: keyof T, pattern: RegExp, message?: string) => ValidationRule<T>;
  custom: (field: keyof T, validator: (value: any) => boolean, message?: string) => ValidationRule<T>;
} {
  return {
    required: (field, message) => ({ field, required: true, message }),
    minLength: (field, length, message) => ({ field, minLength: length, message }),
    maxLength: (field, length, message) => ({ field, maxLength: length, message }),
    pattern: (field, pattern, message) => ({ field, pattern, message }),
    custom: (field, validator, message) => ({ field, custom: validator, message })
  };
}