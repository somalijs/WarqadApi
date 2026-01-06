import { ExpressRequest } from "../../types/Express.js";
import jwt from "jsonwebtoken";
type GetTokenParam = {
  req: ExpressRequest;
  name?: string;
  throwError?: boolean;
};
const getToken = async <T extends object & { decoded: string }>({
  req,
  throwError = false,
}: GetTokenParam): Promise<T> => {
  let token;
  //  = req.cookies[name];
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      token = parts[1];
    }
  }

  if (!token && throwError) {
    throw new Error("Keys are missing");
  }
  const decoded = jwt.verify(token!, process.env.JWT_SECRET as string) as T;

  return decoded;
};

export default getToken;
