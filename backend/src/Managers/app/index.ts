import { Model } from 'mongoose';
import getAppModel, { AppDocument } from '../../models/app.js';
import { ExpressRequest } from '../../types/Express.js';
import { getClientDomain } from '../../func/customs.js';

type AppManagerProps = {};

class AppManager {
  private Model: Model<AppDocument>;

  constructor({}: AppManagerProps) {
    this.Model = getAppModel();
  }

  // get host
  async getHost(req: ExpressRequest) {
    const apps = getClientDomain(req);
    const { subdomain } = apps;
    const app = await this.Model.findOne({
      host: subdomain === '5000' ? '3001' : subdomain,
    });
    if (!app) {
      throw new Error('App not found with this host');
    }

    return app;
  }
  async getPrivateHost(req: ExpressRequest) {
    const apps = getClientDomain(req);
    const { domain } = apps;
    const app = await this.Model.findOne({
      host: domain === '5000' ? '3005' : domain,
    });

    if (!app) {
      throw new Error('App not found with this host');
    }

    return app;
  }
}

export default AppManager;
