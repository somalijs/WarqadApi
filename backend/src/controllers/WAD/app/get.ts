import expressAsyncHandler from 'express-async-handler';
import App from '../../../services/Apps/index.js';
import { ExpressRequest, ExpressResponse } from '../../../types/Express.js';

const getApps = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const apps = await App.get({ req });
    res.status(200).json(apps);
  }
);
export const getSecretkey = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const app = await App.getSecretkey({ appId: req.params.id });
    res.status(200).json(app);
  }
);
export default getApps;
