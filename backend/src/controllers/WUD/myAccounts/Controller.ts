import expressAsyncHandler from 'express-async-handler';
import Account from '../../../services/Accounts/index.js';
import { ExpressRequest, ExpressResponse } from '../../../types/Express.js';
const getAccounts = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const data = await Account.get({ req });
    res.status(200).json(data);
  }
);

export { getAccounts };
