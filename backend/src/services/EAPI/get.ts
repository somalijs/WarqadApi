import getPackageModel from '../../models/Packages.js';
import { ExpressRequest } from '../../types/Express.js';
import { z } from 'zod';
const schema = z.object({
  type: z.enum(['umrah', 'hajj', 'hotel']),
});
const getWebsite = async ({ req }: { req: ExpressRequest }) => {
  const { db } = req;
  const { type } = schema.parse(req.query);
  const { name }: any = req.query;
  const matches: Record<string, any> = {
    isDeleted: false,
    type,
  };
  if (name) {
    matches.name = { $regex: name?.toLowerCase(), $options: 'i' };
  }
  const Package = getPackageModel(db!);
  const fetchData = await Package.aggregate([
    {
      $match: matches,
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
      $sort: { price: -1 },
    },
  ]);
  return name ? fetchData[0] : fetchData;
};

export default getWebsite;
