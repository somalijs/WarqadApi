import mongoose from "mongoose";
import getClientModel from "../../../models/Clients.js";
import { ExpressRequest } from "../../../types/Express.js";

const getClients = async ({ req }: { req: ExpressRequest }) => {
  const Client = getClientModel(req.db!);
  const { id } = req.query;
  const matches: any = {};
  if (id) {
    matches._id = new mongoose.Types.ObjectId(id as string);
  }
  const clients = await Client.aggregate([
    {
      $match: matches,
    },
    {
      $lookup: {
        from: "messages",
        localField: "_id",
        foreignField: "client",
        as: "messages",
      },
    },
  ]);
  if (!clients.length && id) {
    throw new Error("Client not found");
  }
  return id ? clients[0] : clients;
};

export default getClients;
