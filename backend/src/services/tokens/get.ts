import { ExpressRequest } from '../../types/Express.js';
import jwt from 'jsonwebtoken';
type GetTokenParam = {
  req: ExpressRequest;
  name: string;
  throwError?: boolean;
};
const getToken = async <T extends object & { decoded: string }>({
  req,
  name,
  throwError = false,
}: GetTokenParam): Promise<T> => {
  const token = req.cookies[name];

  if (!token && throwError) {
    throw new Error('Keys are missing');
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as T;

  return decoded;
};

export default getToken;
