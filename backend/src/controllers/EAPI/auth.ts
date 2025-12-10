import expressAsyncHandler from 'express-async-handler';

const EAPI_AUTH = expressAsyncHandler(async (_req, res) => {
  res.status(200).json({ message: 'App authenticated' });
});

export default EAPI_AUTH;
