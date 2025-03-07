import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import User from '../models/user.model';
import { AppError } from '../utils/errors';
// Redis import removed
import logger from '../utils/logger';
import { auth } from '../middleware/auth.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import crypto from 'crypto';

const router = Router();
const CACHE_EXPIRATION = 3600; // 1 hour

// Signup
router.post('/signup', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    // Create new user
    const user = await User.create({
      name,
      displayName: name, // Initially set displayName same as name
      email,
      password
    });

    // Generate token with all required fields
    const token = jwt.sign(
      { 
        id: user._id,
        name: user.name,
        role: user.role || 'user'
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    const userData = {
      id: user._id,
      name: user.name,
      displayName: user.displayName,
      email: user.email,
      avatar: user.avatar,
      role: user.role
    };

    res.status(201).json({
      success: true,
      data: {
        token,
        user: userData
      }
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check if password is correct
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate token
    const token = jwt.sign(
      { 
        id: user._id,
        name: user.name,
        role: user.role || 'user'
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    // Cache user data - removed Redis operation
    const userData = {
      id: user._id,
      name: user.name,
      displayName: user.displayName,
      email: user.email,
      avatar: user.avatar,
      role: user.role
    };
    // Redis operation removed

    res.json({
      success: true,
      data: {
        token,
        user: userData
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new AppError('No token provided', 401);
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret) as { id: string };
    
    // Get from database
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const userData = {
      id: user._id,
      name: user.name,
      displayName: user.displayName,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      company: user.company,
      github: user.github,
      github_username: user.github,
      linkedin: user.linkedin,
      personalWebsite: user.personalWebsite,
      education: user.education
    };

    return res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    next(error);
  }
});

// Logout
router.post('/logout', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new AppError('No token provided', 401);
    }

    // Verify token to get user ID
    const decoded = jwt.verify(token, config.jwtSecret) as { id: string };
    
    // Redis operation removed

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
});

router.get('/verify', auth, async (req: AuthRequest, res: Response) => {
  try {
    // If middleware passed, token is valid
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token' 
      });
    }

    res.json({ 
      success: true,
      user: req.user 
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ 
      success: false,
      message: 'Invalid token' 
    });
  }
});

// GitHub sync endpoint
router.post('/github/sync', async (req, res, next) => {
  try {
    const { name, email, avatar, github, github_username, _id } = req.body;

    if (!email || !name) {
      throw new AppError('Email and name are required', 400);
    }

    // Find or create user
    let user = await User.findOne({ email });
    let isNewUser = false;
    
    if (user) {
      // Update existing user with GitHub data
      user.name = name;
      user.displayName = user.displayName || name; // Keep existing displayName if set
      user.avatar = avatar || user.avatar;
      user.github = github_username || github;
      user.github_username = github_username || github;
      await user.save();
    } else {
      // Create new user with GitHub data
      isNewUser = true;
      // Generate a secure random password that meets the minimum length requirement
      const randomPassword = crypto.randomBytes(16).toString('hex'); // 32 characters long
      
      user = await User.create({
        name,
        displayName: name, // Initially set displayName same as name
        email,
        avatar,
        github: github_username || github,
        github_username: github_username || github,
        password: randomPassword // This will be hashed by the pre-save middleware
      });
    }

    // Generate token
    const token = jwt.sign(
      { 
        id: user._id,
        name: user.name,
        role: user.role || 'user'
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    // Prepare user data for response
    const userData = {
      id: user._id,
      name: user.name,
      displayName: user.displayName,
      email: user.email,
      avatar: user.avatar,
      github: user.github,
      github_username: user.github_username,
      role: user.role,
      supabase_id: _id // Store the Supabase ID separately
    };

    res.json({
      success: true,
      data: {
        token,
        user: userData,
        isNewUser
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update profile
router.put('/profile', auth, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Extract fields from request body
    const {
      name,
      displayName,
      company,
      role,
      github,
      linkedin,
      personalWebsite,
      education
    } = req.body;

    // Update basic information
    if (name) user.name = name;
    if (displayName) user.displayName = displayName;
    if (company) user.company = company;
    if (role) user.role = role;

    // Update social links
    if (github) user.github = github;
    if (linkedin) user.linkedin = linkedin;
    if (personalWebsite) user.personalWebsite = personalWebsite;

    // Update education
    if (education) {
      user.education = {
        university: education.university || user.education?.university,
        graduationYear: education.graduationYear || user.education?.graduationYear
      };
    }

    // Handle password update if provided
    if (req.body.newPassword) {
      user.password = req.body.newPassword;
    } else if (req.body.currentPassword && req.body.newPassword) {
      const isPasswordValid = await user.comparePassword(req.body.currentPassword);
      if (!isPasswordValid) {
        throw new AppError('Current password is incorrect', 401);
      }
      user.password = req.body.newPassword;
    }

    await user.save();

    // Prepare user data for response
    const userData = {
      id: user._id,
      name: user.name,
      displayName: user.displayName,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      company: user.company,
      github: user.github,
      linkedin: user.linkedin,
      personalWebsite: user.personalWebsite,
      education: user.education
    };

    // Redis operation removed

    res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    next(error);
  }
});

// Setup password after GitHub signup
router.post('/setup-password', auth, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { password } = req.body;
    if (!password || password.length < 6) {
      throw new AppError('Password must be at least 6 characters long', 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Update user's password
    user.password = password;
    await user.save();

    // Prepare user data for response
    const userData = {
      id: user._id,
      name: user.name,
      displayName: user.displayName,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      company: user.company,
      github: user.github,
      github_username: user.github,
      linkedin: user.linkedin,
      personalWebsite: user.personalWebsite,
      education: user.education
    };

    res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    next(error);
  }
});

// Get user profile by username
router.get('/users/:username', async (req, res, next) => {
  try {
    const { username } = req.params;

    // Find user by displayName or name with exact case-sensitive matching
    const user = await User.findOne({
      $or: [
        { displayName: { $eq: username } },
        { name: { $eq: username } }
      ]
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Prepare user data for response (excluding sensitive information)
    const userData = {
      id: user._id,
      name: user.name,
      displayName: user.displayName,
      avatar: user.avatar,
      company: user.company,
      github: user.github,
      linkedin: user.linkedin,
      personalWebsite: user.personalWebsite,
      education: user.education
    };

    res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    next(error);
  }
});

export default router; 