import { Request, Response, NextFunction } from 'express';
import Event from '../models/event.model';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { getCache, setCache, clearCache } from '../utils/cache';

const CACHE_EXPIRATION = 3600; // 1 hour

export const getAllEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const type = req.query.type as string;
    const status = req.query.status as string;

    const cacheKey = `events:all:${page}:${limit}:${type || 'all'}:${status || 'all'}`;
    const cachedData = await getCache(cacheKey);
    
    if (cachedData) {
      return res.json({ success: true, data: cachedData });
    }

    const query: any = {};
    if (type && type !== 'all') {
      query.type = type;
    }
    if (status && status !== 'all') {
      query.status = status;
    }

    const currentDate = new Date();
    if (status === 'upcoming') {
      query.startDate = { $gt: currentDate };
    } else if (status === 'past') {
      query.endDate = { $lt: currentDate };
    } else if (status === 'ongoing') {
      query.startDate = { $lte: currentDate };
      query.endDate = { $gte: currentDate };
    }

    const skip = (page - 1) * limit;
    const events = await Event.find(query)
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Event.countDocuments(query);

    const data = {
      events,
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
    logger.error('Error in getAllEvents:', error);
    next(error);
  }
};

export const getEventDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const cacheKey = `events:${id}`;
    const cachedData = await getCache(cacheKey);
    
    if (cachedData) {
      return res.json({ success: true, data: cachedData });
    }

    const event = await Event.findById(id)
      .populate('organizer', 'name avatar')
      .populate('attendees', 'name avatar')
      .lean();

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    // Increment views
    await Event.findByIdAndUpdate(id, { $inc: { views: 1 } });

    await setCache(cacheKey, event, CACHE_EXPIRATION);
    res.json({ success: true, data: event });
  } catch (error) {
    logger.error('Error in getEventDetails:', error);
    next(error);
  }
};

export const createEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new AppError('User must be authenticated to create an event', 401);
    }

    const eventData = {
      ...req.body,
      organizer: userId,
      attendees: [userId],
    };

    const event = await Event.create(eventData);
    
    // Clear events cache
    await clearCache('events:*');

    res.status(201).json({ success: true, data: event });
  } catch (error) {
    logger.error('Error in createEvent:', error);
    next(error);
  }
};

export const updateEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    const event = await Event.findById(id);
    if (!event) {
      throw new AppError('Event not found', 404);
    }

    if (event.organizer.toString() !== userId) {
      throw new AppError('Only the organizer can update the event', 403);
    }

    const updatedEvent = await Event.findByIdAndUpdate(id, req.body, { new: true });

    // Clear event caches
    await clearCache(`events:${id}`);
    await clearCache('events:all:*');

    res.json({ success: true, data: updatedEvent });
  } catch (error) {
    logger.error('Error in updateEvent:', error);
    next(error);
  }
};

export const deleteEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    const event = await Event.findById(id);
    if (!event) {
      throw new AppError('Event not found', 404);
    }

    if (event.organizer.toString() !== userId) {
      throw new AppError('Only the organizer can delete the event', 403);
    }

    await Event.deleteOne({ _id: id });

    // Clear event caches
    await clearCache(`events:${id}`);
    await clearCache('events:all:*');

    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    logger.error('Error in deleteEvent:', error);
    next(error);
  }
};

export const attendEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError('User must be authenticated to attend events', 401);
    }

    const event = await Event.findById(id);
    if (!event) {
      throw new AppError('Event not found', 404);
    }

    const userIndex = event.attendees.findIndex(attendee => attendee.toString() === userId);
    if (userIndex === -1) {
      event.attendees.push(userId);
    } else {
      event.attendees.splice(userIndex, 1);
    }

    await event.save();
    await clearCache(`events:${id}`);

    res.json({ success: true, data: event });
  } catch (error) {
    logger.error('Error in attendEvent:', error);
    next(error);
  }
};

export const getUpcomingEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cacheKey = 'events:upcoming';
    const cachedData = await getCache(cacheKey);
    
    if (cachedData) {
      return res.json({ success: true, data: cachedData });
    }

    const currentDate = new Date();
    const events = await Event.find({
      startDate: { $gt: currentDate },
    })
      .sort({ startDate: 1 })
      .limit(5)
      .lean();

    await setCache(cacheKey, events, CACHE_EXPIRATION);
    res.json({ success: true, data: events });
  } catch (error) {
    logger.error('Error in getUpcomingEvents:', error);
    next(error);
  }
}; 