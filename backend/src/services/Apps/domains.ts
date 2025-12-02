import z from 'zod';
import { ExpressRequest } from '../../types/Express.js';
import { ClientSession } from 'mongoose';
import getAppModel from '../../models/app.js';
import addLogs from '../Logs.js';

const Schema = z.object({
  domain: z.string().min(1),
  action: z.enum(['add', 'remove']),
});

const Domains = async ({
  req,
  session,
}: {
  req: ExpressRequest;
  session: ClientSession;
}) => {
  const { domain, action } = Schema.parse(req.body);
  const { id } = req.params;
  const App = getAppModel();
  const isApp = await App.findOne({ _id: id, isDeleted: false }).session(
    session
  );
  if (!isApp) {
    throw new Error('App not found');
  }
  if (action === 'add') {
    if ((isApp.domains || []).includes(domain)) {
      throw new Error('Domain already added');
    }
  } else {
    if (!(isApp.domains || []).includes(domain)) {
      throw new Error('Domain does not exist in app');
    }
  }
  const updateQuery =
    action === 'add'
      ? { $addToSet: { domains: domain } }
      : { $pull: { domains: domain } };

  const updated = await App.findOneAndUpdate({ _id: id }, updateQuery, {
    runValidators: true,
    new: true,
    session,
  });

  if (!updated) {
    throw new Error(`update failed`);
  }
  // add log
  await addLogs({
    model: { type: 'app', _id: updated._id },
    data: { updated: updated.domains },
    old: { updated: updated.domains },
    by: req.by!,
    action: 'update',
    session,
  });
  return {
    success: true,
    data: updated,
    message: `Domain access ${
      action === 'add' ? 'added' : 'removed'
    } successfully`,
  };
};

export default Domains;
