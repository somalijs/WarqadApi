import { ClientSession } from "mongoose";
import { ExpressRequest } from "../../../types/Express.js";
import getClientModel from "../../../models/Clients.js";
import getMessageModel from "../../../models/Messages.js";
import { requestCallSchema } from "./schema.js";
import { io } from "../../../server.js";

type props = {
  req: ExpressRequest;
  session: ClientSession;
};

const requestCall = async ({ req, session }: props) => {
  const Client = getClientModel(req.db!);
  const Message = getMessageModel(req.db!);

  const data = requestCallSchema.parse(req.body);

  // 1. Check if client exists
  let client = await Client.findOne({ phoneNumber: data.phoneNumber }).session(
    session,
  );

  // 2. If not, create client
  if (!client) {
    const clients = await Client.create(
      [
        {
          name: data.name,
          phoneNumber: data.phoneNumber,
        },
      ],
      { session },
    );
    if (!clients.length) throw new Error("Client not created");
    client = clients[0];
  }
  const datas: any = {
    client: client._id,
    message: data.message,
  };
  if (data?.unit) datas.unit = data.unit;
  if (data?.property) datas.property = data.property;
  // 3. Create Message
  const messages = await Message.create([datas], { session });
  io.emit("refreshClientMessages", {
    client: client._id,
  });
  return {
    client,
    message: messages[0],
  };
};

export default requestCall;
