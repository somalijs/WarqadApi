import { ClientSession } from "mongoose";
import { ExpressRequest } from "../../../types/Express.js";
import requestCall from "./requestCall.js";
import deleteClient from "./delete.js";
import getClients from "./get.js";
import getMessages from "./getMessages.js";

type props = {
  req: ExpressRequest;
  session: ClientSession;
};

class ClientsManager {
  req: ExpressRequest;
  session: ClientSession;

  constructor({ req, session }: props) {
    this.req = req;
    this.session = session;
  }

  async getClients() {
    return await getClients({ req: this.req });
  }

  async getMessages() {
    return await getMessages({ req: this.req });
  }

  async requestCall() {
    return await requestCall({ req: this.req, session: this.session });
  }

  async delete() {
    return await deleteClient({ req: this.req, session: this.session });
  }
}

export default ClientsManager;
