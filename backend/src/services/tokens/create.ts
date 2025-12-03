import jwt from 'jsonwebtoken';
import { ExpressResponse } from '../../types/Express.js';
const createToken = async ({
  res,
  name,
  decoded,
  maxAge = 24 * 60 * 60 * 1000,
}: {
  res: ExpressResponse;
  name: string;
  decoded: string;
  maxAge?: number;
}) => {
  const token = jwt.sign({ decoded }, process.env.JWT_SECRET as string, {
    expiresIn: '24h',
  });
  // Always httpOnly for security; secure only in production
  res.cookie(name, token, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    domain:
      process.env.NODE_ENV === 'production' ? process.env.DOMAIN : undefined,
    maxAge: maxAge,
  });
  return token;
};

export default createToken;
