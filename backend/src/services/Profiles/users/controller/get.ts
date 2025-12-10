import mongoose from 'mongoose';
import { ExpressRequest } from '../../../../types/Express.js';

import { DocumentUser } from '../../../../models/profiles/User.js';
import { Model } from 'mongoose';

const getUsers = async ({
  req,
  Model,
}: {
  req: ExpressRequest;
  Model: Model<DocumentUser>;
}) => {
  const { id, role, select, query } = req.query;

  let match: any = {
    isDeleted: false,
  };
  if (query) {
    match.$or = [
      { name: { $regex: query, $options: 'i' } },
      { surname: { $regex: query, $options: 'i' } },
    ];
  }
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
              type: 'email-verification',
            },
          },
        ],
        as: 'verifications',
      },
    },
    {
      $lookup: {
        from: 'apps',
        localField: 'app',
        foreignField: '_id',
        as: 'app',
      },
    },
    {
      $unwind: {
        path: '$app',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        appName: {
          $concat: ['$app.name', ' (', '$app.type', ')'],
        },
        appId: '$app._id',
        appType: '$app.type',
      },
    },
    {
      $unwind: {
        path: '$verifications',
        preserveNullAndEmptyArrays: true,
      },
    },
    // stores
    {
      $lookup: {
        from: 'stores',
        let: { userStores: { $ifNull: ['$stores', []] }, userRole: '$role' },
        pipeline: [
          {
            $match: {
              $expr: {
                $cond: [
                  { $eq: ['$$userRole', 'admin'] }, // if admin → match all stores
                  true,
                  { $in: ['$_id', '$$userStores'] }, // else only user's stores
                ],
              },
            },
          },
          {
            $addFields: {
              status: {
                $cond: [{ $eq: ['$isActive', true] }, 'active', 'inactive'],
              },
            },
          },
        ],
        as: 'stores',
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
        appName: item.appName,
        appId: item.appId,
        appType: item.appType,
      };
    });
  }
  if (!resData.length) {
    throw new Error(id ? `User not found` : `No Users found`);
  }
  return id ? resData[0] : resData;
};
export default getUsers;
