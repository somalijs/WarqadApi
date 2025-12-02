import { ExpressRequest } from '../types/Express.js';

export const getClientDomain = (req: ExpressRequest) => {
  // Origin from browser fetch/XHR
  let origin = req.headers.origin || req.headers.referer;

  // Fallback for Postman / direct navigation
  if (!origin) {
    origin = `http://${req.headers.host}`;
  }

  // Extract hostname
  const hostname = new URL(origin).hostname;

  return { origin, hostname };
};
