import expressAsyncHandler from 'express-async-handler';
import z from 'zod';
import App from '../../../services/Apps/index.js';

const schema = z.object({
  type: z.enum(['package']),
});
const websiteContoller = expressAsyncHandler(async (req, res) => {
  const { type } = schema.parse(req.params);
  let resData;
  switch (type) {
    case 'package':
      resData = await App.Package.get({ req });
      break;
    default:
      throw new Error('Invalid type');
  }
  res.status(200).json(resData);
});

export { websiteContoller };
