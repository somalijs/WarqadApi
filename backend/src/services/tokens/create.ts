import jwt from 'jsonwebtoken';
import { ExpressResponse } from '../../types/Express.js';
const createToken = async ({
  res,
  name,
  decoded,
}: // maxAge = 24 * 60 * 60 * 1000,
{
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
    domain: '.warqad.com',
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  } as any);
  return token;
};

export default createToken;
