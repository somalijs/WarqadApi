import { ClientSession } from "mongoose";
import { ExpressRequest } from "../../../types/Express.js";
import createProperty from "./create.js";
import updateProperty from "./update.js";
import deleteProperty from "./delete.js";
import addUnit from "./addUnit.js";
import updateUnit from "./updateUnit.js";
import deleteUnit from "./deleteUnit.js";
import getProperties from "./get.js";
import findProperty from "./find.js";
import findUnit from "./findUnit.js";

type props = {
  req: ExpressRequest;
  session: ClientSession;
};

class PropertiesManager {
  req: ExpressRequest;
  session: ClientSession;

  constructor({ req, session }: props) {
    this.req = req;
    this.session = session;
  }
  async get() {
    return await getProperties({ req: this.req });
  }
  async find() {
    return await findProperty({ req: this.req });
  }
  async findUnit() {
    return await findUnit({ req: this.req });
  }
  async create() {
    return await createProperty({ req: this.req, session: this.session });
  }

  async update() {
    return await updateProperty({ req: this.req, session: this.session });
  }

  async delete() {
    return await deleteProperty({ req: this.req, session: this.session });
  }

  async addUnit() {
    return await addUnit({ req: this.req, session: this.session });
  }

  async updateUnit() {
    return await updateUnit({ req: this.req, session: this.session });
  }

  async deleteUnit() {
    return await deleteUnit({ req: this.req, session: this.session });
  }
}

export default PropertiesManager;
