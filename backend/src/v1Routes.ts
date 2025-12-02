import express from 'express';

import wadRoutes from './Wad.js';
import wudRoutes from './wud.js';
import EAPI from './routes/EAPI/route.js';
import Protect from './middleware/auth/Protect.js';
export default function v1Routes(app: express.Application) {
  const Api = '/api/v1';

  wadRoutes(Api, app);
  wudRoutes(Api, app);
  app.use(`${Api}/eapi`, Protect.EAPI, EAPI);
}
