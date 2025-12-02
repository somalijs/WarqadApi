import z from 'zod';
import { ExpressRequest } from '../../../../types/Express.js';
import mongoose from 'mongoose';
import getAgentModel from '../../../../models/profiles/Agent.js';
import addLogs from '../../../Logs.js';
import moment from 'moment-timezone';
import { dbName } from '../../../../server.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const EmailLogin = async ({
  req,
  session,
}: {
  req: ExpressRequest;
  session: mongoose.ClientSession;
}) => {
  const Model = getAgentModel();
  const { email, password } = loginSchema.parse(req.body);
  const user = await Model.findOne({ email, isDeleted: false }).session(
    session
  );
  if (!user) {
    throw new Error('User not found');
  }

  // if not email verified
  if (!user.isEmailVerified) {
    throw new Error('Your email is not verified! Please verify your email');
  }
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new Error('Invalid password');
  }
  // if not active
  if (!user.isActive) {
    throw new Error('Your account is not active! Please contact support');
  }
  const device = req.headers['user-agent'] || 'Unknown device';
  // create logs
  await addLogs({
    model: { type: 'agent', _id: user._id },
    data: {
      action: 'login',
      ip: req.ip,
      device,
      email: email,
      time: moment().tz('Africa/Nairobi').format('DD/MM/YYYY HH:mm:ss'),
    },
    old: {},
    by: { _id: user._id, name: `${user.name} ${user.surname}` },
    action: 'login',
    dbName: dbName,
    session: session,
  });

  const resData = user.toObject();
  delete resData.password;
  return resData;
};
