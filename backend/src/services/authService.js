const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { query, isMockMode } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is missing. Set JWT_SECRET in your .env file.');
}

const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Base64URL encoding helpers
function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return Buffer.from(str, 'base64').toString('utf8');
}

// Generate Secure HMAC SHA-256 Token
function generateToken(payload) {
  if (!JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable is required.');
  }

  const header = { alg: 'HS256', typ: 'JWT' };
  const enrichedPayload = {
    ...payload,
    exp: Date.now() + TOKEN_EXPIRY_MS
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(enrichedPayload));

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Verify Token
function verifyToken(token) {
  if (!token || typeof token !== 'string' || !JWT_SECRET) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;

  // Verify HMAC signature
  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  // Constant-time comparison with length check to prevent timing attacks
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSignature);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch (err) {
    return null;
  }
}

// Validate credentials against DB users table with bcrypt, or fallback to env credentials
async function validateCredentials(username, password) {
  const trimmedUser = (username || '').trim();
  const trimmedPass = (password || '').trim();

  if (!trimmedUser || !trimmedPass) {
    return { isValid: false, user: null };
  }

  // 1. Try DB lookup in users table if DB is available
  if (!isMockMode()) {
    try {
      const users = await query('SELECT id, username, password, role FROM users WHERE username = ? LIMIT 1', [trimmedUser]);
      if (users && users.length > 0) {
        const dbUser = users[0];
        let passwordMatches = false;

        // Check if stored password is a bcrypt hash
        if (dbUser.password && (dbUser.password.startsWith('$2a$') || dbUser.password.startsWith('$2b$') || dbUser.password.startsWith('$2y$'))) {
          passwordMatches = await bcrypt.compare(trimmedPass, dbUser.password);
        } else {
          // Constant-time compare for plaintext passwords
          const inputBuf = Buffer.from(trimmedPass);
          const dbPassBuf = Buffer.from(dbUser.password || '');
          if (inputBuf.length === dbPassBuf.length && crypto.timingSafeEqual(inputBuf, dbPassBuf)) {
            passwordMatches = true;
          }
        }

        if (passwordMatches) {
          return {
            isValid: true,
            user: {
              id: dbUser.id,
              user_id: dbUser.id,
              username: dbUser.username,
              role: dbUser.role || 'admin'
            }
          };
        }
      }
    } catch (dbErr) {
      console.warn('DB user lookup failed, falling back to environment check:', dbErr.message);
    }
  }

  // 2. Fallback to ADMIN_USERNAME and ADMIN_PASSWORD from environment
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD;

  if (!expectedUser || !expectedPass) {
    throw new Error('FATAL: ADMIN_USERNAME and ADMIN_PASSWORD environment variables are required.');
  }

  const userBuf = Buffer.from(trimmedUser);
  const expUserBuf = Buffer.from(expectedUser.trim());
  const passBuf = Buffer.from(trimmedPass);
  const expPassBuf = Buffer.from(expectedPass.trim());

  const userMatches = userBuf.length === expUserBuf.length && crypto.timingSafeEqual(userBuf, expUserBuf);
  const passMatches = passBuf.length === expPassBuf.length && crypto.timingSafeEqual(passBuf, expPassBuf);

  if (userMatches && passMatches) {
    return {
      isValid: true,
      user: {
        id: 1,
        user_id: 1,
        username: expectedUser.trim(),
        role: 'admin'
      }
    };
  }

  return { isValid: false, user: null };
}

module.exports = {
  generateToken,
  verifyToken,
  validateCredentials
};
