/**
 * Authentication Configuration
 * Centralized auth settings and utilities
 */

const authConfig = {
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'photo-sharing-app',
    audience: process.env.JWT_AUDIENCE || 'photo-sharing-users'
  },

  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12
  },

  password: {
    minLength: parseInt(process.env.PASSWORD_MIN_LENGTH) || 8,
    maxLength: parseInt(process.env.PASSWORD_MAX_LENGTH) || 128,
    requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
    requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false',
    requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS !== 'false',
    requireSpecialChars: process.env.PASSWORD_REQUIRE_SPECIAL !== 'false'
  },

  session: {
    maxSessions: parseInt(process.env.MAX_SESSIONS_PER_USER) || 5,
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 24 * 60 * 60 * 1000 // 24 hours
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
    maxAttempts: parseInt(process.env.RATE_LIMIT_MAX_ATTEMPTS) || 100,
    loginWindowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5
  },

  security: {
    requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION === 'true',
    enableTwoFactor: process.env.ENABLE_2FA === 'true',
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION) || 30 * 60 * 1000, // 30 minutes
    maxFailedAttempts: parseInt(process.env.MAX_FAILED_ATTEMPTS) || 5
  },

  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      enabled: process.env.GOOGLE_AUTH_ENABLED === 'true'
    },
    facebook: {
      appId: process.env.FACEBOOK_APP_ID,
      appSecret: process.env.FACEBOOK_APP_SECRET,
      enabled: process.env.FACEBOOK_AUTH_ENABLED === 'true'
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      enabled: process.env.GITHUB_AUTH_ENABLED === 'true'
    }
  },

  email: {
    resetTokenExpiry: parseInt(process.env.RESET_TOKEN_EXPIRY) || 60 * 60 * 1000, // 1 hour
    verificationTokenExpiry: parseInt(process.env.VERIFICATION_TOKEN_EXPIRY) || 24 * 60 * 60 * 1000, // 24 hours
    resendCooldown: parseInt(process.env.EMAIL_RESEND_COOLDOWN) || 5 * 60 * 1000 // 5 minutes
  }
};

/**
 * Validate password strength
 */
const validatePassword = (password) => {
  const { minLength, maxLength, requireUppercase, requireLowercase, requireNumbers, requireSpecialChars } = authConfig.password;
  
  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  
  if (password.length > maxLength) {
    errors.push(`Password must not exceed ${maxLength} characters`);
  }
  
  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Generate password regex pattern
 */
const getPasswordRegex = () => {
  const { requireUppercase, requireLowercase, requireNumbers, requireSpecialChars } = authConfig.password;
  
  let pattern = '^';
  
  if (requireUppercase) {
    pattern += '(?=.*[A-Z])';
  }
  
  if (requireLowercase) {
    pattern += '(?=.*[a-z])';
  }
  
  if (requireNumbers) {
    pattern += '(?=.*\\d)';
  }
  
  if (requireSpecialChars) {
    pattern += '(?=.*[!@#$%^&*()_+\\-=\\[\\]{};\':"\\\\|,.<>\\/?])';
  }
  
  pattern += '.+$';
  
  return new RegExp(pattern);
};

/**
 * Check if JWT is expired
 */
const isTokenExpired = (token) => {
  try {
    const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return decoded.exp * 1000 < Date.now();
  } catch (error) {
    return true;
  }
};

/**
 * Calculate password strength score
 */
const calculatePasswordStrength = (password) => {
  let score = 0;
  
  // Length bonus
  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 25;
  
  // Character variety bonus
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/\d/.test(password)) score += 10;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 10;
  
  // Pattern penalties
  if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated characters
  if (/123|abc|qwe/i.test(password)) score -= 10; // Common patterns
  
  return Math.max(0, Math.min(100, score));
};

/**
 * Get password strength label
 */
const getPasswordStrengthLabel = (score) => {
  if (score < 30) return 'Very Weak';
  if (score < 50) return 'Weak';
  if (score < 70) return 'Fair';
  if (score < 90) return 'Good';
  return 'Strong';
};

/**
 * Validate JWT configuration
 */
const validateConfig = () => {
  const errors = [];
  
  if (!authConfig.jwt.secret || authConfig.jwt.secret.length < 32) {
    errors.push('JWT secret must be at least 32 characters long');
  }
  
  if (authConfig.bcrypt.saltRounds < 10) {
    errors.push('Bcrypt salt rounds should be at least 10 for security');
  }
  
  if (authConfig.password.minLength < 8) {
    errors.push('Minimum password length should be at least 8 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Generate secure configuration for production
 */
const generateSecureConfig = () => {
  const crypto = require('crypto');
  
  return {
    jwtSecret: crypto.randomBytes(64).toString('hex'),
    bcryptSaltRounds: 12,
    sessionSecret: crypto.randomBytes(32).toString('hex'),
    apiKey: `sk_${crypto.randomBytes(24).toString('hex')}`
  };
};

module.exports = {
  authConfig,
  validatePassword,
  getPasswordRegex,
  isTokenExpired,
  calculatePasswordStrength,
  getPasswordStrengthLabel,
  validateConfig,
  generateSecureConfig
}; 