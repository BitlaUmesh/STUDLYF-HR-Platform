const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = crypto.createHash('sha256')
  .update(process.env.JWT_SECRET || process.env.JWT_REFRESH_SECRET || 'studlyf_hr_default_encryption_secret_key')
  .digest();

/**
 * Encrypt a plain text string (e.g. SMTP password).
 * @param {string} text Plain text to encrypt
 * @returns {string} Encrypted payload format: "iv_hex:auth_tag_hex:encrypted_data_hex"
 */
function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt an encrypted string.
 * @param {string} encryptedData Payload format "iv_hex:auth_tag_hex:encrypted_data_hex"
 * @returns {string|null} Decrypted original string
 */
function decrypt(encryptedData) {
  if (!encryptedData) return null;
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) return null;
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('[Encryption Decrypt Error]', err.message);
    return null;
  }
}

module.exports = {
  encrypt,
  decrypt,
};
