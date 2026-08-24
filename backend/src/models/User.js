import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: false, // Optional for Google OAuth users
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    picture: {
      type: String,
    },
    role: {
      type: String,
      default: 'user',
    },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
