import expressAsyncHandler from 'express-async-handler';
import { ExpressRequest, ExpressResponse } from '../../../types/Express.js';
import Agent from '../../../services/Profiles/agents/index.js';

const getAgents = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const data = await Agent.get({ req });

    res.status(200).json(data);
  }
);

export { getAgents };
