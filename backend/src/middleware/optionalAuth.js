import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'smart_resume_screener_super_secret_jwt_key_2026';

export const optionalAuth = async (req, _res, next) => {
  req.user = null;
  req.userId = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
        req.userId = user._id;
      }
    } catch (error) {
      // Invalid/expired token — proceed as guest
      req.user = null;
      req.userId = null;
    }
  }

  next();
};
