import { Request, Response, NextFunction } from 'express';
import StoreItem from '../models/store.model';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { getCache, setCache, clearCache } from '../utils/cache';

const CACHE_EXPIRATION = 3600; // 1 hour

export const getAllStoreItems = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const category = req.query.category as string;
    const status = req.query.status || 'approved';

    const cacheKey = `store:items:${page}:${limit}:${category}:${status}`;
    const cachedData = await getCache(cacheKey);
    
    if (cachedData) {
      return res.json({ success: true, data: cachedData });
    }

    // Build query
    const query: any = { status };
    if (category && category !== 'all') {
      query.category = category;
    }

    const skip = (page - 1) * limit;
    const items = await StoreItem.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name')
      .lean();

    const total = await StoreItem.countDocuments(query);

    const data = {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    await setCache(cacheKey, data, CACHE_EXPIRATION);
    return res.json({ success: true, data });
  } catch (error) {
    logger.error('Error in getAllStoreItems:', error);
    next(error);
  }
};

export const getStoreItemDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const cacheKey = `store:item:${id}`;
    const cachedData = await getCache(cacheKey);
    
    if (cachedData) {
      return res.json({ success: true, data: cachedData });
    }
    
    const item = await StoreItem.findById(id)
      .populate('author', 'name')
      .lean();

    if (!item) {
      throw new AppError('Store item not found', 404);
    }

    // Increment views
    await StoreItem.findByIdAndUpdate(id, { $inc: { views: 1 } });

    await setCache(cacheKey, item, CACHE_EXPIRATION);
    res.json({ success: true, data: item });
  } catch (error) {
    logger.error('Error in getStoreItemDetails:', error);
    next(error);
  }
};

export const addStoreItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newItem = await StoreItem.create({
      ...req.body,
      status: 'approved'
    });

    // Populate the author field
    const populatedItem = await newItem.populate('author', 'name');

    // Clear store items cache
    await clearCache('store:items:*');

    res.status(201).json({ success: true, data: populatedItem });
  } catch (error) {
    logger.error('Error in addStoreItem:', error);
    next(error);
  }
};

export const addReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const user = (req as any).user;

    if (!user) {
      throw new AppError('Authentication required', 401);
    }

    const item = await StoreItem.findById(id);

    if (!item) {
      throw new AppError('Store item not found', 404);
    }

    // Check if user already reviewed this item
    const existingReviewIndex = item.reviews.findIndex(
      (review) => review.user_name === user.name
    );

    if (existingReviewIndex !== -1) {
      // Update existing review
      item.reviews[existingReviewIndex].user_name = user.name;
      item.reviews[existingReviewIndex].rating = rating;
      if (comment) {
        item.reviews[existingReviewIndex].comment = comment;
      }
      item.reviews[existingReviewIndex].createdAt = new Date();
    } else {
      // Add new review
      item.reviews.push({
        user_id: req.body.user_id,
        user_name: user.name,
        rating,
        comment: comment || 'No comment provided',
        createdAt: new Date()
      });
    }

    await item.save();

    // Clear item cache
    await clearCache(`store:item:${id}`);

    res.json({ success: true, data: item });
  } catch (error) {
    logger.error('Error in addReview:', error);
    next(error);
  }
};

export const deleteStoreItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const item = await StoreItem.findById(id);

    if (!item) {
      throw new AppError('Store item not found', 404);
    }

    await StoreItem.deleteOne({ _id: id });

    // Clear store caches
    await clearCache(`store:item:${id}`);
    await clearCache('store:items:*');

    res.json({ success: true, message: 'Store item deleted successfully' });
  } catch (error) {
    logger.error('Error in deleteStoreItem:', error);
    next(error);
  }
};

export const getUserTools = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    console.log('Fetching tools for user:', userId);

    if (!userId) {
      throw new AppError('User must be authenticated', 401);
    }

    const cacheKey = `store:user:tools:${userId}`;
    const cachedData = await getCache(cacheKey);
    
    if (cachedData) {
      return res.json({
        success: true,
        data: {
          tools: cachedData
        }
      });
    }

    const tools = await StoreItem.find({ author: userId })
      .sort({ createdAt: -1 })
      .populate('author', 'name')
      .lean();

    console.log('Found tools:', tools.length);

    await setCache(cacheKey, tools, CACHE_EXPIRATION);

    res.json({
      success: true,
      data: {
        tools: tools || []
      }
    });
  } catch (error) {
    console.error('Error in getUserTools:', error);
    next(error);
  }
}; 