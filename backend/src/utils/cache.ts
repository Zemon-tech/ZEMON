import redisClient from '../config/redis';
import logger from './logger';

const DEFAULT_EXPIRATION = 3600; // 1 hour in seconds

export const setCache = async (key: string, value: any, expiration: number = DEFAULT_EXPIRATION): Promise<void> => {
  try {
    const stringValue = JSON.stringify(value);
    await redisClient.setex(key, expiration, stringValue);
    logger.info(`Cache SET: ${key} (expires in ${expiration}s)`);
  } catch (error) {
    logger.error('Redis set error:', error);
  }
};

export const getCache = async (key: string): Promise<any> => {
  try {
    const data = await redisClient.get(key);
    if (data) {
      logger.info(`Cache HIT: ${key}`);
      return JSON.parse(data);
    }
    logger.info(`Cache MISS: ${key}`);
    return null;
  } catch (error) {
    logger.error('Redis get error:', error);
    return null;
  }
};

export const deleteCache = async (key: string): Promise<void> => {
  try {
    await redisClient.del(key);
    logger.info(`Cache DELETE: ${key}`);
  } catch (error) {
    logger.error('Redis delete error:', error);
  }
};

export const clearCache = async (pattern: string): Promise<void> => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
      logger.info(`Cache CLEAR: ${pattern} (${keys.length} keys)`);
    }
  } catch (error) {
    logger.error('Redis clear error:', error);
  }
};

export const getCacheMulti = async (keys: string[]): Promise<any[]> => {
  try {
    const pipeline = redisClient.pipeline();
    keys.forEach(key => pipeline.get(key));
    const results = await pipeline.exec();
    const hits = results?.filter(result => result[1]).length || 0;
    logger.info(`Cache MULTI GET: ${keys.length} keys (${hits} hits)`);
    return results?.map(result => result[1] ? JSON.parse(result[1] as string) : null) || [];
  } catch (error) {
    logger.error('Redis multi get error:', error);
    return [];
  }
};
