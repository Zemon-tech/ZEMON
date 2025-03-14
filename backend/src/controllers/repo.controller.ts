import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import Repo from '../models/repo.model';
import { AppError } from '../utils/errors';
import { fetchGitHubRepo, validateGitHubUrl } from '../utils/github';
import logger from '../utils/logger';
import { getCache, setCache, clearCache } from '../utils/cache';

const CACHE_EXPIRATION = 3600; // 1 hour

export const getRepos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const cacheKey = `repos:all:${page}:${limit}`;

    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.json({ success: true, data: cachedData });
    }

    const skip = (page - 1) * limit;
    const repos = await Repo.find()
      .populate('added_by', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Transform the data to ensure no undefined values
    const transformedRepos = repos.map(repo => ({
      ...repo,
      language: repo.programming_language || 'Not Specified',
      added_by: repo.added_by || {
        _id: 'deleted',
        name: 'Deleted User'
      }
    }));

    const total = await Repo.countDocuments();
    const data = {
      repos: transformedRepos,
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
    logger.error('Error in getRepos:', error);
    next(error);
  }
};

export const getRepoDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid repository ID', 400);
    }

    const cacheKey = `repos:${id}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.json({ success: true, data: cachedData });
    }

    const repo = await Repo.findById(id).lean();

    if (!repo) {
      throw new AppError('Repository not found', 404);
    }

    await setCache(cacheKey, repo, CACHE_EXPIRATION);
    res.json({ success: true, data: repo });
  } catch (error) {
    next(error);
  }
};

export const addRepo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { github_url, description, language, tags } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError('User must be authenticated to add a repository', 401);
    }

    if (!github_url) {
      throw new AppError('GitHub URL is required', 400);
    }

    logger.info(`Attempting to add repository: ${github_url}`);

    const urlData = await validateGitHubUrl(github_url);
    if (!urlData) {
      throw new AppError('Invalid GitHub URL format', 400);
    }

    const existingRepo = await Repo.findOne({ github_url });
    if (existingRepo) {
      throw new AppError('Repository already exists', 400);
    }

    // Fetch GitHub data
    const githubData = await fetchGitHubRepo(urlData.owner, urlData.repo);

    // Normalize language value and store it in a field that won't conflict with MongoDB's language field
    const repoLanguage = language 
      ? language.toLowerCase() 
      : githubData.language?.toLowerCase() || 'not specified';

    // Create repo with combined data
    const repo = new Repo({
      ...githubData,
      description: description || githubData.description,
      programming_language: repoLanguage,
      tags: tags || [],
      added_by: userId,
    });

    await repo.save();
    const populatedRepo = await repo.populate('added_by', 'name');
    
    await clearCache('repos:*');
    res.status(201).json({ success: true, data: populatedRepo });
  } catch (error) {
    next(error);
  }
};

export const updateRepo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid repository ID', 400);
    }

    const repo = await Repo.findById(id);
    if (!repo) {
      throw new AppError('Repository not found', 404);
    }

    // Sync with GitHub
    const urlData = await validateGitHubUrl(repo.github_url);
    if (!urlData) {
      throw new AppError('Invalid GitHub URL', 400);
    }

    const githubData = await fetchGitHubRepo(urlData.owner, urlData.repo);
    const updatedRepo = await Repo.findByIdAndUpdate(
      id,
      {
        ...githubData,
        last_synced: new Date(),
      },
      { new: true }
    );

    await clearCache(`repos:${id}`);
    await clearCache('repos:all:*');
    res.json({ success: true, data: updatedRepo });
  } catch (error) {
    next(error);
  }
};

export const deleteRepo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid repository ID', 400);
    }

    const repo = await Repo.findById(id);
    if (!repo) {
      throw new AppError('Repository not found', 404);
    }

    await Repo.findByIdAndDelete(id);
    await clearCache(`repos:${id}`);
    await clearCache('repos:all:*');
    res.json({ success: true, message: 'Repository deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const likeRepo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError('User must be authenticated to like a repository', 401);
    }

    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid repository ID', 400);
    }

    const repo = await Repo.findById(id);
    if (!repo) {
      throw new AppError('Repository not found', 404);
    }

    const userIndex = repo.likes.findIndex(like => like.toString() === userId.toString());
    if (userIndex === -1) {
      repo.likes.push(userId);
    } else {
      repo.likes.splice(userIndex, 1);
    }

    await repo.save();
    await clearCache(`repos:${id}`);
    res.json({ success: true, data: repo });
  } catch (error) {
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

    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid repository ID', 400);
    }

    if (!content) {
      throw new AppError('Comment content is required', 400);
    }

    const repo = await Repo.findById(id);
    if (!repo) {
      throw new AppError('Repository not found', 404);
    }

    repo.comments.push({
      user: userId,
      content,
      createdAt: new Date(),
    });

    await repo.save();
    await clearCache(`repos:${id}`);

    const updatedRepo = await Repo.findById(id).lean();
    res.json({ success: true, data: updatedRepo });
  } catch (error) {
    next(error);
  }
};

export const getUserRepos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new AppError('User must be authenticated', 401);
    }

    const cacheKey = `repos:user:${userId}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: {
          repos: cachedData
        }
      });
    }

    const repos = await Repo.find({ added_by: userId })
      .populate('added_by', 'name')
      .sort({ createdAt: -1 })
      .lean();

    await setCache(cacheKey, repos, CACHE_EXPIRATION);

    res.json({
      success: true,
      data: {
        repos: repos || []
      }
    });
  } catch (error) {
    console.error('Error in getUserRepos:', error);
    next(error);
  }
};