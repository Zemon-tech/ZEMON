import axios from 'axios';
import { config } from '../config/config';
import logger from './logger';

const PING_INTERVAL = 5 * 60 * 1000; // 5 minutes
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${config.port}`;

export const startKeepAlive = () => {
  setInterval(async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/test`);
      if (response.status === 200) {
        logger.debug('Keep-alive ping successful');
      }
    } catch (error) {
      logger.error('Keep-alive ping failed:', error);
    }
  }, PING_INTERVAL);

  logger.info('Keep-alive service started');
}; 