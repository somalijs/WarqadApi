import {
  ExpressNextFunction,
  ExpressRequest,
  ExpressResponse,
} from '../../types/Express.js';
import Agent from './Agent.js';
import EAPI from './EAPI.js';
import User from './User.js';
const Protect = {
  Agent: Agent,
  User,
  EAPI,
};

export const Authorize = (...roles: string[]) => {
  return (
    req: ExpressRequest,
    _res: ExpressResponse,
    next: ExpressNextFunction
  ) => {
    const role = req.role!;

    if (!roles.includes(role)) {
      throw new Error(`You are not authorized to access this route as ${role}`);
    }
    next();
  };
};
export default Protect;
