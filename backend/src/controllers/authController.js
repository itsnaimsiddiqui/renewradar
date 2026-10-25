const { generateToken, validateCredentials } = require('../services/authService');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    const isValid = validateCredentials(username, password);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    const token = generateToken({
      username: username.trim(),
      role: 'admin',
      loginTime: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          username: username.trim(),
          role: 'admin'
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
