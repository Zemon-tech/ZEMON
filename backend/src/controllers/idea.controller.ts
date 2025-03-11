import { Request, Response, NextFunction } from "express";
import Idea from "../models/idea.model";
import { AppError } from "../utils/errors";
import logger from "../utils/logger";
import { getCache, setCache, clearCache } from "../utils/cache";

const CACHE_EXPIRATION = 3600; // 1 hour

export const getIdeas = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const cacheKey = `ideas:all:${page}:${limit}`;
    const cachedData = await getCache(cacheKey);
    
    if (cachedData) {
      return res.json({ success: true, data: cachedData });
    }

    const skip = (page - 1) * limit;
    const ideas = await Idea.find()
      .populate("author", "name")
      .populate("comments.userId", "name avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Idea.countDocuments();

    const data = {
      ideas,
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
    logger.error("Error in getIdeas:", error);
    next(error);
  }
};

export const getIdeaDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const cacheKey = `ideas:${id}`;
    const cachedData = await getCache(cacheKey);
    
    if (cachedData) {
      return res.json({ success: true, data: cachedData });
    }

    const idea = await Idea.findById(id)
      .populate("author", "name")
      .populate("comments.userId", "name avatar")
      .lean();

    if (!idea) {
      throw new AppError("Idea not found", 404);
    }

    await setCache(cacheKey, idea, CACHE_EXPIRATION);
    res.json({ success: true, data: idea });
  } catch (error) {
    logger.error("Error in getIdeaDetails:", error);
    next(error);
  }
};

export const createIdea = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError("User must be logged in to create an idea", 401);
    }

    const idea = await Idea.create({
      title,
      description,
      author: userId,
    });

    const populatedIdea = await idea.populate("author", "name");
    
    // Clear ideas cache
    await clearCache("ideas:*");

    res.status(201).json({ success: true, data: populatedIdea });
  } catch (error) {
    logger.error("Error in createIdea:", error);
    next(error);
  }
};

export const updateIdea = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    const idea = await Idea.findById(id);
    if (!idea) {
      throw new AppError("Idea not found", 404);
    }

    if (idea.author.toString() !== userId) {
      throw new AppError("Not authorized to update this idea", 403);
    }

    const updatedIdea = await Idea.findByIdAndUpdate(id, req.body, { new: true })
      .populate("author", "name");

    // Clear idea caches
    await clearCache(`ideas:${id}`);
    await clearCache("ideas:all:*");

    res.json({ success: true, data: updatedIdea });
  } catch (error) {
    logger.error("Error in updateIdea:", error);
    next(error);
  }
};

export const deleteIdea = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    const idea = await Idea.findById(id);
    if (!idea) {
      throw new AppError("Idea not found", 404);
    }

    if (idea.author.toString() !== userId) {
      throw new AppError("Not authorized to delete this idea", 403);
    }

    await idea.deleteOne();

    // Clear idea caches
    await clearCache(`ideas:${id}`);
    await clearCache("ideas:all:*");

    res.json({ success: true, message: "Idea deleted successfully" });
  } catch (error) {
    logger.error("Error in deleteIdea:", error);
    next(error);
  }
};

export const addComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = (req as any).user?.id;
    const userName = (req as any).user?.name;

    if (!userId || !userName) {
      throw new AppError("User must be authenticated to comment", 401);
    }

    if (!text?.trim()) {
      throw new AppError("Comment text is required", 400);
    }

    const idea = await Idea.findById(id);
    if (!idea) {
      throw new AppError("Idea not found", 404);
    }

    const comment = {
      userId,
      username: userName,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`,
      text: text.trim(),
      createdAt: new Date()
    };

    idea.comments.push(comment);
    await idea.save();
    
    // Clear idea cache
    await clearCache(`ideas:${id}`);

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    logger.error("Error in addComment:", error);
    next(error);
  }
};
