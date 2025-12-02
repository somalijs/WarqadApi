import mongoose from 'mongoose';
import { ExpressRequest } from '../../../../types/Express.js';
import getAgentModel from '../../../../models/profiles/Agent.js';

const getAgents = async ({ req }: { req: ExpressRequest }) => {
  const { id, role, select } = req.query;
  const Model = getAgentModel();
  let match: any = {
    isDeleted: false,
  };
  if (id) {
    match._id = new mongoose.Types.ObjectId(id as string);
  }
  if (role) {
    match.role = role;
  }

  const find = await Model.aggregate([
    {
      $match: match,
    },
    {
      $addFields: {
        phoneNumber: {
          $concat: ['$phone.dialCode', '$phone.number'],
        },
        names: {
          $concat: ['$name', ' ', '$surname'],
        },
        status: {
          $cond: {
            if: { $eq: ['$isActive', true] },
            then: 'active',
            else: 'inactive',
          },
        },
      },
    },
    {
      $lookup: {
        from: 'verifications',
        localField: '_id',
        foreignField: 'profile._id',
        pipeline: [
          {
            $match: {
              isUsed: false,
            },
          },
        ],
        as: 'verifications',
      },
    },
    {
      $unwind: {
        path: '$verifications',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        newEmail: {
          $cond: {
            if: { $eq: ['$verifications.type', 'email-verification'] },
            then: '$verifications.email',
            else: null,
          },
        },
        verificationExpires: '$verifications.expires',
        resendAllowed: {
          $dateAdd: {
            startDate: '$verifications.createdAt',
            unit: 'minute',
            amount: 3,
          },
        },
      },
    },

    {
      $project: {
        password: 0,
        verifications: 0,
      },
    },
  ]);
  let resData = find;
  if (select) {
    resData = resData.map((item: any) => {
      return {
        label: item.names,
        value: item._id,
        phoneNumber: item.phoneNumber,
        status: item.status,
      };
    });
  }
  if (!resData.length) {
    throw new Error(id ? `Agent not found` : `No Agents found`);
  }
  return id ? resData[0] : resData;
};
export default getAgents;
