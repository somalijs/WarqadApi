import expressAsyncHandler from 'express-async-handler';
import { ExpressRequest, ExpressResponse } from '../../types/Express.js';
import z from 'zod';
import AppManager from '../../Managers/app/index.js';

const schema = z.object({
  type: z.enum(['host']),
});

const appController = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    let resData;
    const { type } = schema.parse(req.params);
    const App = new AppManager({});
    switch (type) {
      case 'host':
        resData = await App.getHost(req);
        break;
      default:
        throw new Error('Invalid type');
    }
    res.status(200).json(resData);
  }
);

export default appController;
