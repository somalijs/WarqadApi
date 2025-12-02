import express from 'express';
import myUsers from './routes/wud/myUsers.js';
import myStores from './routes/wud/myStores.js';
import myAccounts from './routes/wud/myAccounts.js';
import website from './routes/wud/website.js';

export default function wudRoutes(Api: string, app: express.Application) {
  const WUDApi = `${Api}/wud`;
  app.use(`${Api}/my-users`, myUsers);
  app.use(`${Api}/my-stores`, myStores);
  app.use(`${Api}/my-accounts`, myAccounts);
  app.use(`${WUDApi}/website`, website);
}
