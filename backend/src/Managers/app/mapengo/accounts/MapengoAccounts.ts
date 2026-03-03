import mongoose, { ClientSession } from "mongoose";
import { ExpressRequest } from "../../../../types/Express.js";
import z from "zod";
import zodFields from "../../../../zod/Fields.js";
import Enums from "../../../../func/Enums.js";

import mapengoCustomer from "./reports/customer.js";
import mapengoSupplier from "./reports/supplier.js";
import mapengoEmployee from "./reports/employee.js";
import mapengoDrawer from "./reports/drawer.js";

type props = {
  req: ExpressRequest;
  session: ClientSession;
};
class MapengoAccounts {
  req: ExpressRequest;
  session: ClientSession;
  constructor({ req, session }: props) {
    this.req = req;
    this.session = session;
  }
  async reports() {
    const reportSchema = z.object({
      type: z.enum(["customer", "supplier", "employee", "drawer"]),
      store: zodFields.objectId("store id").optional(),
      id: zodFields.objectId("account id").optional(),
      currency: z.enum(Enums.currencies).optional(),
      search: z.string().optional(),
      supplierType: z.string().optional(),
    });
    const { type, store, id, currency, search, supplierType } =
      reportSchema.parse(this.req.query);
    const accountMatches: any = {
      isDeleted: false,
    };
    if (store) {
      accountMatches.store = new mongoose.Types.ObjectId(store);
    }
    if (currency) {
      accountMatches.currency = currency;
    }
    if (id) {
      accountMatches._id = new mongoose.Types.ObjectId(id);
    }
    if (search) {
      const or: any[] = [{ name: { $regex: search, $options: "i" } }];

      if (mongoose.Types.ObjectId.isValid(search)) {
        or.push({ _id: new mongoose.Types.ObjectId(search) });
      }

      accountMatches.$or = or;
    }
    if (supplierType) {
      accountMatches.supplierType = supplierType;
    }

    let response: any;
    switch (type) {
      case "customer":
        response = await mapengoCustomer({
          matches: accountMatches,
          req: this.req,
        });
        break;
      case "supplier":
        response = await mapengoSupplier({
          matches: accountMatches,
          req: this.req,
        });
        break;
      case "employee":
        response = await mapengoEmployee({
          matches: accountMatches,
          req: this.req,
        });
        break;
      case "drawer":
        response = await mapengoDrawer({
          matches: accountMatches,
          req: this.req,
        });
        break;
      default:
        throw new Error(`Invalid account type ${type}`);
    }
    return id ? response[0] : response;
  }
}

export default MapengoAccounts;
