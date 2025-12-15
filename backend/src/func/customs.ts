import { ExpressRequest } from '../types/Express.js';

export const getClientDomain = (req: ExpressRequest) => {
  // Origin from browser fetch/XHR
  let origin = req.headers.origin || req.headers.referer;

  // Fallback for Postman / direct navigation
  if (!origin) {
    origin = `http://${req.headers.host}`;
  }

  // Extract hostname and port
  const url = new URL(origin);
  const hostname = url.hostname; // e.g., "app.warqad.com" or "localhost"
  const port = url.port; // e.g., "3000"

  let subdomain: string | null = null;
  let domain = hostname;

  if (hostname === 'localhost') {
    // For localhost, use the port as "subdomain"
    subdomain = port || 'default';
    domain = port || 'localhost';
  } else {
    // Split hostname for real domains
    const parts = hostname.split('.');
    if (parts.length > 2) {
      subdomain = parts.slice(0, parts.length - 2).join('.');
      domain = parts.slice(-2).join('.');
    }
  }

  return { origin, hostname, domain, subdomain };
};
