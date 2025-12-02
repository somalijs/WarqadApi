import { getClientDomain } from '../../func/customs.js';
import { ExpressRequest } from '../../types/Express.js';
import { z } from 'zod';
import zodFields from '../../zod/Fields.js';
import getAppModel from '../../models/app.js';
const schema = z.object({
  app: zodFields.objectId('App ID '),
});
const getWebsite = async ({ req }: { req: ExpressRequest }) => {
  const { app } = schema.parse(req.query);
  const { hostname } = getClientDomain(req);
  const isApp = await getAppModel().findOne({ _id: app, isDeleted: false });
  if (!isApp) {
    throw new Error('Invalid App key');
  }
  const domains = isApp?.domains || [];
  if (!domains.includes(hostname)) {
    throw new Error('You are not allowed to access this app');
  }
  return {
    app,
    domain: getClientDomain(req),
  };
};

export default getWebsite;
