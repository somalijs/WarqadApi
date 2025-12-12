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
    const { subdomain } = getClientDomain(req);
    const app = await this.Model.findOne({
      host: subdomain === '5000' ? '3001' : subdomain,
    });
    if (!app) {
      throw new Error('App not found with this host');
    }

    return app;
  }
}

export default AppManager;
