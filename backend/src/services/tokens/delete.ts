import { ExpressResponse } from '../../types/Express.js';
const deleteToken = (res: ExpressResponse, token: string) => {
  res.cookie(token, '', {
    path: '/',
    httpOnly: process.env.NODE_ENV !== 'development',
    secure: process.env.NODE_ENV !== 'development',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    domain: process.env.NODE_ENV !== 'development' ? process.env.DOMAIN : '',
    maxAge: 0,
  });
};

export default deleteToken;
