import { Request, Response, NextFunction } from 'express';
import News from '../models/news.model';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { getCache, setCache, clearCache } from '../utils/cache';

const CACHE_EXPIRATION = 3600; // 1 hour

export const getAllNews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const category = req.query.category as string;

    const cacheKey = `news:all:${page}:${limit}:${category || 'all'}`;
    const cachedData = await getCache(cacheKey);
    
    if (cachedData) {
      return res.json({ success: true, data: cachedData });
    }

    const query: any = {};
    if (category && category !== 'all') {
      query.category = category;
    }

    const skip = (page - 1) * limit;
    const news = await News.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await News.countDocuments(query);

    const data = {
      news,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    await setCache(cacheKey, data, CACHE_EXPIRATION);
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Error in getAllNews:', error);
    next(error);
  }
};

export const getNewsDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const cacheKey = `news:${id}`;
    const cachedData = await getCache(cacheKey);
    
    if (cachedData) {
      return res.json({ success: true, data: cachedData });
    }

    const newsItem = await News.findById(id).lean();

    if (!newsItem) {
      throw new AppError('News item not found', 404);
    }

    // Increment views
    await News.findByIdAndUpdate(id, { $inc: { views: 1 } });

    await setCache(cacheKey, newsItem, CACHE_EXPIRATION);
    res.json({ success: true, data: newsItem });
  } catch (error) {
    logger.error('Error in getNewsDetails:', error);
    next(error);
  }
};

export const createNews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newsItem = await News.create(req.body);
    
    // Clear news cache
    await clearCache('news:*');

    res.status(201).json({ success: true, data: newsItem });
  } catch (error) {
    logger.error('Error in createNews:', error);
    next(error);
  }
};

export const updateNews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const newsItem = await News.findByIdAndUpdate(id, req.body, { new: true });

    if (!newsItem) {
      throw new AppError('News item not found', 404);
    }

    // Clear news caches
    await clearCache(`news:${id}`);
    await clearCache('news:all:*');

    res.json({ success: true, data: newsItem });
  } catch (error) {
    logger.error('Error in updateNews:', error);
    next(error);
  }
};

export const deleteNews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const newsItem = await News.findById(id);

    if (!newsItem) {
      throw new AppError('News item not found', 404);
    }

    await News.deleteOne({ _id: id });

    // Clear news caches
    await clearCache(`news:${id}`);
    await clearCache('news:all:*');

    res.json({ success: true, message: 'News item deleted successfully' });
  } catch (error) {
    logger.error('Error in deleteNews:', error);
    next(error);
  }
};

export const likeNews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError('User must be authenticated to like news', 401);
    }

    const newsItem = await News.findById(id);
    if (!newsItem) {
      throw new AppError('News item not found', 404);
    }

    const userIndex = newsItem.likes.findIndex(like => like.toString() === userId.toString());
    if (userIndex === -1) {
      newsItem.likes.push(userId);
    } else {
      newsItem.likes.splice(userIndex, 1);
    }

    await newsItem.save();
    await clearCache(`news:${id}`);

    res.json({ success: true, data: newsItem });
  } catch (error) {
    logger.error('Error in likeNews:', error);
    next(error);
  }
};

export const addComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError('User must be authenticated to comment', 401);
    }

    const newsItem = await News.findById(id);
    if (!newsItem) {
      throw new AppError('News item not found', 404);
    }

    newsItem.comments.push({
      user: userId,
      content,
      createdAt: new Date()
    });

    await newsItem.save();
    await clearCache(`news:${id}`);

    res.json({ success: true, data: newsItem });
  } catch (error) {
    logger.error('Error in addComment:', error);
    next(error);
  }
}; 