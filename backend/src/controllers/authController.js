const { generateToken, validateCredentials } = require('../services/authService');

// In-memory rate limiting map for login attempts: ip -> { count, firstAttempt }
const loginRateLimitMap = new Map();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip) {
  const now = Date.now();
  const record = loginRateLimitMap.get(ip);

  if (!record) {
    loginRateLimitMap.set(ip, { count: 1, firstAttempt: now });
    return { allowed: true };
  }

  if (now - record.firstAttempt > WINDOW_MS) {
    // Reset window
    loginRateLimitMap.set(ip, { count: 1, firstAttempt: now });
    return { allowed: true };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((record.firstAttempt + WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfter };
  }

  record.count += 1;
  return { allowed: true };
}

exports.login = async (req, res) => {
  try {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const rateCheck = checkRateLimit(clientIp);

    if (!rateCheck.allowed) {
      return res.status(429).json({
        success: false,
        message: `Too many login attempts. Please try again after ${rateCheck.retryAfter} seconds.`
      });
    }

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    const { isValid, user } = await validateCredentials(username, password);

    if (!isValid || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Reset rate limiter on successful authentication
    loginRateLimitMap.delete(clientIp);

    const token = generateToken({
      id: user.id,
      user_id: user.id,
      username: user.username,
      role: user.role,
      loginTime: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          user_id: user.id,
          username: user.username,
          role: user.role
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
