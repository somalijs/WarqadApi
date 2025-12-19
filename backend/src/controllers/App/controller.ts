import expressAsyncHandler from 'express-async-handler';
import { ExpressRequest, ExpressResponse } from '../../types/Express.js';
import z from 'zod';
import AppManager from '../../Managers/app/index.js';
import StoreManger from '../../Managers/app/Stores/index.js';
import AccountsManager from '../../Managers/app/accounts/index.js';
import DrawerManager from '../../Managers/app/drawers/index.js';
import TransactionManager from '../../Managers/app/transaction/index.js';

const schema = z.object({
  type: z.enum([
    'host',
    'stores',
    'accounts',
    'private-host',
    'drawer',
    'transaction',
    'get-statement',
  ]),
});

const appFreeController = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    let resData;
    const { type } = schema.parse(req.params);
    const App = new AppManager({});
    switch (type) {
      case 'host':
        resData = await App.getHost(req);
        break;
      case 'private-host':
        resData = await App.getPrivateHost(req);
        break;

      default:
        throw new Error('Invalid typea');
    }
    res.status(200).json(resData);
  }
);
const appPrivateController = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    let resData;
    const { type } = schema.parse(req.params);

    switch (type) {
      case 'stores':
        const Store = new StoreManger({ db: req.db! });
        resData = await Store.get(req);
        break;
      case 'accounts':
        const Account = new AccountsManager({ db: req.db!, req });
        resData = await Account.get();
        break;
      case 'drawer':
        const Drawer = new DrawerManager({ db: req.db!, req });
        resData = await Drawer.get();
        break;
      case 'transaction':
        const Transaction = new TransactionManager({ db: req.db!, req });
        resData = await Transaction.get();
        break;
      case 'get-statement':
        const schemaStatement = z.object({
          profile: z.enum([
            'supplier',
            'customer',
            'broker',
            'employee',
            'drawer',
          ]),
        });
        const { profile } = schemaStatement.parse(req.params);
        if (!req.query?.id) {
          throw new Error('Id is required');
        }
        if (profile === 'drawer') {
          const Drawer = new DrawerManager({ db: req.db!, req });
          resData = await Drawer.get();
        } else {
          const Account = new AccountsManager({ db: req.db!, req });
          resData = await Account.get();
        }
        break;
      default:
        throw new Error('Invalid type');
    }
    res.status(200).json(resData);
  }
);
export { appFreeController, appPrivateController };
