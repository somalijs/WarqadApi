import z from "zod";
import { ClientSession } from "mongoose";
import { ExpressRequest } from "../../../types/Express.js";
import ClientsManager from "./ClientsManager.js";

const schema = z.object({
  method: z.enum(["delete", "getClients", "getMessages"]),
});

const privateClientsController = async ({
  req,
  session,
}: {
  req: ExpressRequest;
  session: ClientSession;
}) => {
  const { method } = schema.parse(req.query);
  const clientsManager = new ClientsManager({ req, session });
  const resData = await clientsManager[method]();

  return resData;
};

export default privateClientsController;
