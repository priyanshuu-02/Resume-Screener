import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_that_is_long_and_random';

export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * Register user with Email + Password
 */
export const registerUser = async ({ fullName, email, password }) => {
  if (!email || !password || !fullName) {
    throw new Error('Full Name, Email, and Password are required.');
  }

  const cleanEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: cleanEmail });

  if (existingUser) {
    throw new Error('An account with this email already exists. Please log in.');
  }

  // Generate username from email
  const baseUsername = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
  const username = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;

  const hashedPassword = await hashPassword(password);

  const createdUser = await User.create({
    fullName: fullName.trim(),
    username,
    email: cleanEmail,
    password: hashedPassword,
  });

  return createdUser;
};

/**
 * Google OAuth login/register via Google Credential (ID token) or Profile Object
 */
export const googleOAuthLogin = async ({ credential, googleId, email, name, picture }) => {
  let gId = googleId;
  let gEmail = email;
  let gName = name;
  let gPic = picture;

  // If a Google Credential ID Token is provided, decode its payload
  if (credential) {
    try {
      const parts = credential.split('.');
      if (parts.length === 3) {
        let base64Url = parts[1];
        let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
          base64 += '=';
        }
        const payloadJson = Buffer.from(base64, 'base64').toString('utf-8');
        const payload = JSON.parse(payloadJson);
        gId = payload.sub || gId;
        gEmail = payload.email || gEmail;
        gName = payload.name || gName;
        gPic = payload.picture || gPic;
      }
    } catch (e) {
      console.warn('[googleOAuthLogin] Could not parse Google ID token payload:', e.message);
    }
  }

  if (!gEmail) {
    throw new Error('Valid email is required from Google OAuth.');
  }

  const cleanEmail = gEmail.toLowerCase().trim();
  let user = await User.findOne({
    $or: [{ googleId: gId }, { email: cleanEmail }],
  });

  if (user) {
    if (!user.googleId && gId) user.googleId = gId;
    if (gPic && !user.picture) user.picture = gPic;
    await user.save();
  } else {
    const baseUsername = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    const username = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;

    user = await User.create({
      fullName: gName || 'Google User',
      username,
      email: cleanEmail,
      googleId: gId,
      picture: gPic,
    });
  }

  return user;
};

/**
 * Authenticates user via Username/Email + Password
 */
export const authenticateUser = async (identifier, password) => {
  if (!identifier || !password) return null;

  const cleanId = identifier.toLowerCase().trim();
  const user = await User.findOne({
    $or: [{ username: cleanId }, { email: cleanId }],
  });

  if (!user || !user.password) return null;

  const isMatch = await bcrypt.compare(password, user.password);
  return isMatch ? user : null;
};

/**
 * Generates a signed JWT token
 */
export const generateToken = (user) => {
  const payload = {
    id: user._id,
    username: user.username,
    email: user.email,
    name: user.fullName,
    picture: user.picture,
    role: user.role || 'user',
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
};
