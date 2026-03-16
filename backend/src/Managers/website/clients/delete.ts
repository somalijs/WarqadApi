import { ClientSession } from "mongoose";
import { ExpressRequest } from "../../../types/Express.js";
import getClientModel from "../../../models/Clients.js";
import getMessageModel from "../../../models/Messages.js";
import { deleteClientSchema } from "./schema.js";

type props = {
  req: ExpressRequest;
  session: ClientSession;
};

const deleteClient = async ({ req, session }: props) => {
  const Client = getClientModel(req.db!);
  const Message = getMessageModel(req.db!);

  const { id } = deleteClientSchema.parse(req.query);

  // 1. Delete the client
  const deletedClient = await Client.findByIdAndDelete(id, { session });
  if (!deletedClient) {
    throw new Error("Client not found");
  }

  // 2. Delete all messages associated with this client
  await Message.deleteMany({ client: id }, { session });

  return { message: "Client and associated messages deleted successfully" };
};

export default deleteClient;
