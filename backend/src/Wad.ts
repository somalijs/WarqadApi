import express from 'express';
import apps from './routes/wad/app.js';
import agent from './routes/wad/agent.js';
import users from './routes/wad/users.js';
import stores from './routes/wad/stores.js';
export default function wadRoutes(Api: string, app: express.Application) {
  app.use(`${Api}/agents`, agent);
  app.use(`${Api}/apps`, apps);
  app.use(`${Api}/users`, users);
  app.use(`${Api}/stores`, stores);
}
