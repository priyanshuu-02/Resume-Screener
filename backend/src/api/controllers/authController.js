import * as authService from '../../services/authService.js';

/**
 * Google OAuth Authentication
 * POST /api/v1/auth/google
 */
export const googleAuth = async (req, res) => {
  const { credential, googleId, email, name, picture } = req.body;

  if (!email && !credential) {
    return res.status(400).json({ success: false, message: 'Google email or credential is required.' });
  }

  try {
    const user = await authService.googleOAuthLogin({ credential, googleId, email, name, picture });
    const token = authService.generateToken(user);

    res.json({
      success: true,
      message: 'Google OAuth login successful!',
      token,
      user: {
        id: user._id,
        name: user.fullName,
        username: user.username,
        email: user.email,
        picture: user.picture,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error during Google OAuth:', error.message);
    res.status(500).json({ success: false, message: error.message || 'Google OAuth failed.' });
  }
};

/**
 * Register user with Email + Password
 * POST /api/v1/auth/register
 */
export const registerUser = async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields (Full Name, Email, Password) are required.' });
  }

  try {
    const user = await authService.registerUser({ fullName, email, password });
    const token = authService.generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        id: user._id,
        name: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error in registration:', error.message);
    if (error.message.includes('already exists')) {
      return res.status(409).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message || 'Server error while creating account.' });
  }
};

/**
 * Direct Login endpoint
 * POST /api/v1/auth/login
 */
export const loginUser = async (req, res) => {
  const { identifier, email, username, password } = req.body;
  const loginId = identifier || email || username;

  if (!loginId || !password) {
    return res.status(400).json({ success: false, message: 'Username/Email and Password are required.' });
  }

  try {
    const user = await authService.authenticateUser(loginId, password);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or user not found.' });
    }

    const token = authService.generateToken(user);

    res.json({
      success: true,
      message: 'Logged in successfully!',
      token,
      user: {
        id: user._id,
        name: user.fullName,
        username: user.username,
        email: user.email,
        picture: user.picture,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error during login:', error.message);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

/**
 * Get current authenticated user profile
 * GET /api/v1/auth/me
 */
export const getMe = async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.fullName,
      username: req.user.username,
      email: req.user.email,
      picture: req.user.picture,
      role: req.user.role,
    },
  });
};
