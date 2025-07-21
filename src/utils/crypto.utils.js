const crypto = require('crypto');
const bcrypt = require('bcryptjs');

/**
 * Crypto Utilities
 * Contains utility functions for cryptographic operations
 */

class CryptoUtils {
  /**
   * Hash password using bcrypt
   */
  static async hashPassword(password, saltRounds = 12) {
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare password with hash
   */
  static async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Generate random token
   */
  static generateRandomToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate UUID v4
   */
  static generateUUID() {
    return crypto.randomUUID();
  }

  /**
   * Generate secure random string
   */
  static generateSecureRandomString(length = 16) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      result += charset[randomIndex];
    }
    
    return result;
  }

  /**
   * Hash data using MD5
   */
  static hashMD5(data) {
    return crypto.createHash('md5').update(data).digest('hex');
  }

  /**
   * Hash data using SHA256
   */
  static hashSHA256(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Hash data using SHA512
   */
  static hashSHA512(data) {
    return crypto.createHash('sha512').update(data).digest('hex');
  }

  /**
   * Generate HMAC
   */
  static generateHMAC(data, secret, algorithm = 'sha256') {
    return crypto.createHmac(algorithm, secret).update(data).digest('hex');
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  static encryptAES(text, secretKey) {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, secretKey, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  static decryptAES(encryptedData, secretKey) {
    const algorithm = 'aes-256-gcm';
    const { encrypted, iv, authTag } = encryptedData;
    
    const decipher = crypto.createDecipher(algorithm, secretKey, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Generate password reset token
   */
  static generatePasswordResetToken() {
    return {
      token: this.generateRandomToken(32),
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };
  }

  /**
   * Generate email verification token
   */
  static generateEmailVerificationToken() {
    return {
      token: this.generateRandomToken(32),
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };
  }

  /**
   * Generate API key
   */
  static generateAPIKey(prefix = 'sk') {
    const randomPart = this.generateRandomToken(24);
    return `${prefix}_${randomPart}`;
  }

  /**
   * Create digital signature
   */
  static createSignature(data, privateKey) {
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(data);
    return sign.sign(privateKey, 'hex');
  }

  /**
   * Verify digital signature
   */
  static verifySignature(data, signature, publicKey) {
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(data);
    return verify.verify(publicKey, signature, 'hex');
  }

  /**
   * Generate keypair for signing
   */
  static generateKeyPair() {
    return crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });
  }

  /**
   * Constant time string comparison (prevents timing attacks)
   */
  static constantTimeCompare(a, b) {
    if (a.length !== b.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }

  /**
   * Generate secure session ID
   */
  static generateSessionId() {
    return this.generateRandomToken(48);
  }

  /**
   * Generate CSRF token
   */
  static generateCSRFToken() {
    return this.generateRandomToken(32);
  }

  /**
   * Hash file buffer for deduplication
   */
  static hashFileBuffer(buffer) {
    return this.hashSHA256(buffer);
  }

  /**
   * Generate device fingerprint
   */
  static generateDeviceFingerprint(userAgent, ip, additionalData = '') {
    const data = `${userAgent}|${ip}|${additionalData}`;
    return this.hashSHA256(data);
  }
}

module.exports = CryptoUtils; 