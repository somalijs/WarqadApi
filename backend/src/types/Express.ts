import { Request, Response, NextFunction } from 'express';

import mongoose from 'mongoose';
import { AppDocument } from '../models/app.js';

type profile = {
  id?: mongoose.Types.ObjectId;
  names?: string;
  name?: string;
  surname?: string;
  phoneNumber?: string;
  email?: string;
  role?: string;
  password?: string;
  status?: string;
  sex?: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  by?: {
    _id: mongoose.Types.ObjectId;
    name: string;
  };
  db?: string;
  appId?: string | mongoose.Types.ObjectId;
  application?: {
    _id?: mongoose.Types.ObjectId;
    name?: string;
    shortName?: string;
    type?: string;
    subType?: string;
    isActive?: boolean;
    status?: string;
  };
  appData?: AppDocument;
  stores?: any[];
  storeIds?: string[];
};
export type ExpressRequest = Request & profile;
export type ExpressResponse = Response;
export type ExpressNextFunction = NextFunction;
