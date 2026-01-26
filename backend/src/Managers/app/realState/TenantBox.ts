import { ClientSession } from "mongoose";
import { ExpressRequest } from "../../../types/Express.js";
import getTenantModel from "../../../models/Tenant.js";
import addLogs from "../../../services/Logs.js";
import TenantSchema from "./schema.js";
import getAccountModel from "../../../models/Acounts.js";

export const addTenant = async ({
  req,
  session,
}: {
  req: ExpressRequest;
  session: ClientSession;
}) => {
  const { customer, floor, no, amount, startDate, deposit } =
    TenantSchema.addTenantSchema.parse(req.body);
  // cehck if customer exist
  const isCustomer = await getAccountModel(req.db!)
    .findOne({
      _id: customer,
      profile: "customer",
      isDeleted: false,
    })
    .session(session);
  if (!isCustomer) {
    throw new Error("Customer not found");
  }
  const existing = await getTenantModel(req.db!)
    .findOne({
      store: isCustomer.store,
      floor,
      no,
      endDate: null, // only active tenants
      isDeleted: false,
    })
    .session(session);

  if (existing) {
    throw new Error(`Floor ${floor} No ${no} is already rented`);
  }
  const tenantData = {
    customer: isCustomer._id,
    store: isCustomer.store,
    floor,
    no,
    deposit,
    amount,
    startDate,
    by: req.by!,
  };

  const create = await getTenantModel(req.db!).create([tenantData], {
    session,
  });
  const tenant = create[0];

  if (!tenant) {
    throw new Error("Failed to create tenant");
  }

  // add logs
  await addLogs({
    model: { type: "tenant", _id: tenant._id },
    data: tenant,
    old: {},
    by: req.by!,
    dbName: req.db!,
    action: "create",
    session: session || null,
  });

  return tenant;
};

export const updateTenant = async ({
  req,
  session,
}: {
  req: ExpressRequest;
  session: ClientSession;
}) => {
  const { _id, floor, no, endDate, ...updateData } =
    TenantSchema.updateTenantSchema.parse(req.body);

  const TenantModel = getTenantModel(req.db!);
  const oldTenant = await TenantModel.findById(_id).session(session);

  if (!oldTenant) {
    throw new Error("Tenant not found");
  }
  const existing = await getTenantModel(req.db!)
    .findOne({
      store: oldTenant.store,
      floor,
      no,
      _id: { $ne: _id },
      endDate: null, // only active tenants
      isDeleted: false,
    })
    .session(session);

  if (existing) {
    throw new Error(`Floor ${floor} No ${no} is already rented`);
  }
  const updateOps: any = {
    $set: { ...updateData },
  };

  // Conditionally set or unset endDate
  if (endDate) {
    updateOps.$set.endDate = endDate; // set endDate if provided
  } else {
    updateOps.$unset = { endDate: "" }; // remove endDate if not provided
  }

  const updatedTenant = await TenantModel.findByIdAndUpdate(_id, updateOps, {
    new: true,
    session,
  });

  if (!updatedTenant) {
    throw new Error("Failed to update tenant");
  }

  // add logs
  await addLogs({
    model: { type: "tenant", _id: updatedTenant._id },
    data: updatedTenant,
    old: oldTenant,
    by: req.by!,
    dbName: req.db!,
    action: "update",
    session: session || null,
  });

  return updatedTenant;
};

export const moveTenant = async ({
  req,
  session,
}: {
  req: ExpressRequest;
  ref?: string;
  session: ClientSession;
}) => {
  const { _id, endDate } = TenantSchema.moveTenantSchema.parse(req.body);

  const TenantModel = getTenantModel(req.db!);
  const oldTenant = await TenantModel.findById(_id).session(session);

  if (!oldTenant) {
    throw new Error("Tenant not found");
  }

  const updatedTenant = await TenantModel.findByIdAndUpdate(
    _id,
    {
      $set: { endDate, isDeleted: true },
    },
    { new: true, session },
  );

  if (!updatedTenant) {
    throw new Error("Failed to move tenant");
  }

  // add logs
  await addLogs({
    model: { type: "tenant", _id: updatedTenant._id },
    data: updatedTenant,
    old: oldTenant,
    by: req.by!,
    dbName: req.db!,
    action: "update",
    session: session || null,
  });

  return updatedTenant;
};

export const deleteTenant = async ({
  req,
  session,
}: {
  req: ExpressRequest;
  session: ClientSession;
}) => {
  const { _id } = TenantSchema.deleteTenantSchema.parse(req.body);

  const TenantModel = getTenantModel(req.db!);
  const oldTenant = await TenantModel.findById(_id).session(session);

  if (!oldTenant) {
    throw new Error("Tenant not found");
  }
  if (oldTenant.isDeleted) {
    throw new Error("Tenant is already deleted");
  }
  const updatedTenant = await TenantModel.findByIdAndUpdate(
    _id,
    {
      $set: { isDeleted: true },
    },
    { new: true, session },
  );

  if (!updatedTenant) {
    throw new Error("Failed to delete tenant");
  }

  // add logs
  await addLogs({
    model: { type: "tenant", _id: updatedTenant._id },
    data: updatedTenant,
    old: oldTenant,
    by: req.by!,
    dbName: req.db!,
    action: "delete",
    session: session || null,
  });

  return updatedTenant;
};
