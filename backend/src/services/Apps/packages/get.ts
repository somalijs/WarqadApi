import getPackageModel from '../../../models/Packages.js';
import { ExpressRequest } from '../../../types/Express.js';
import mongoose from 'mongoose';

const getPackages = async ({ req }: { req: ExpressRequest }) => {
  const Package = getPackageModel(req.db!);
  const { type, id } = req.query;
  const matches: any = {};
  if (type) {
    matches.type = type;
  }

  if (id) {
    matches._id = new mongoose.Types.ObjectId(id as string);
  }

  const find = await Package.aggregate([
    {
      $match: { isDeleted: false, ...matches },
    },
    {
      $lookup: {
        from: 'images',
        localField: '_id',
        foreignField: 'package',
        pipeline: [
          {
            $match: {
              isDeleted: false,
            },
          },
        ],
        as: 'images',
      },
    },
    {
      $addFields: {
        imgUrl: {
          $getField: {
            field: 'path',
            input: { $arrayElemAt: ['$images', 0] },
          },
        },
        imgUrls: '$images',
      },
    },
    {
      $project: {
        images: 0,
      },
    },
  ]);

  if (!find.length)
    throw new Error(id ? ' package not found' : 'No packages found');
  return {
    success: true,
    data: id ? find[0] : find,
  };
};

export default getPackages;
