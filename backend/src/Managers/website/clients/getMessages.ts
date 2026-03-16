import mongoose from "mongoose";
import getClientModel from "../../../models/Clients.js";
import getMessageModel from "../../../models/Messages.js";
import { ExpressRequest } from "../../../types/Express.js";
import z from "zod";
const schema = z.object({
  client: z.string(),
});
const getMessages = async ({ req }: { req: ExpressRequest }) => {
  const Client = getClientModel(req.db!);
  const Message = getMessageModel(req.db!);
  const { client } = schema.parse(req.query);
  // find client by id
  const isClient = await Client.findById(client).lean();
  if (!isClient) {
    throw new Error("Client not found");
  }
  const messages = await Message.aggregate([
    {
      $match: {
        client: new mongoose.Types.ObjectId(client),
      },
    },

    {
      $sort: {
        createdAt: 1,
      },
    },
  ]);

  return {
    messages,
    client: isClient,
  };
};

export default getMessages;
