import { z } from "zod";
import getPropertyModel from "../../../models/Properties.js";
import { ExpressRequest } from "../../../types/Express.js";
import mongoose from "mongoose";

const querySchema = z.object({
  q: z.string().optional(),
  id: z.string().optional(),
  slug: z.string().optional(),
  city: z.string().optional(),
  propertyType: z.string().optional(),
  listingType: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  bedrooms: z.coerce.number().optional(),
  bathrooms: z.coerce.number().optional(),
  isFeatured: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  sortBy: z
    .enum(["newest", "oldest", "priceLow", "priceHigh", "featured"])
    .optional()
    .default("newest"),
  limit: z.coerce.number().optional().default(10),
  page: z.coerce.number().optional().default(1),
});

type props = {
  req: ExpressRequest;
};

const getProperties = async ({ req }: props) => {
  const query = querySchema.parse(req.query);
  const Property = getPropertyModel(req.db!);

  // 1. Initial Match Stage for Properties
  const match: any = { isDeleted: false };
  if (query.id) {
    match._id = new mongoose.Types.ObjectId(query.id);
  }
  if (query.slug) {
    match.slug = query.slug;
  }
  if (query.city) {
    match["location.city"] = { $regex: query.city, $options: "i" };
  }
  if (query.propertyType) {
    match.propertyType = query.propertyType;
  }
  if (query.listingType && query.listingType !== "both") {
    // Include properties that match exactly OR are listed as 'both'
    match.listingType = { $in: [query.listingType, "both"] };
  }
  if (query.isFeatured) {
    match.isFeatured = true;
  }

  if (query.q) {
    match.$or = [
      { name: { $regex: query.q, $options: "i" } },
      { description: { $regex: query.q, $options: "i" } },
      { "location.address": { $regex: query.q, $options: "i" } },
    ];
  }

  // 2. Unit Lookup Pipeline
  const unitPipeline: any[] = [{ $match: { isDeleted: false } }];

  // Bedrooms & Bathrooms Filter
  if (query.bedrooms) {
    unitPipeline.push({
      $match: { "details.bedrooms": query.bedrooms },
    });
  }
  if (query.bathrooms) {
    unitPipeline.push({
      $match: { "details.bathrooms": { $gte: query.bathrooms } },
    });
  }

  // Price Range Filter
  const hasPriceFilter =
    query.minPrice !== undefined || query.maxPrice !== undefined;
  if (hasPriceFilter) {
    const unitPriceFilter: any = {};
    if (query.minPrice !== undefined) unitPriceFilter.$gte = query.minPrice;
    if (query.maxPrice !== undefined) unitPriceFilter.$lte = query.maxPrice;

    const unitOr: any[] = [];
    if (
      !query.listingType ||
      query.listingType === "sale" ||
      query.listingType === "both"
    ) {
      unitOr.push({ "price.sale": unitPriceFilter });
    }
    if (
      !query.listingType ||
      query.listingType === "rent" ||
      query.listingType === "both"
    ) {
      unitOr.push({ "price.rent": unitPriceFilter });
    }

    if (unitOr.length > 0) {
      unitPipeline.push({ $match: { $or: unitOr } });
    }
  }

  const pipeline: any[] = [
    { $match: match },
    {
      $lookup: {
        from: "propertyunits",
        localField: "_id",
        foreignField: "property",
        pipeline: unitPipeline,
        as: "units",
      },
    },
  ];

  // 3. Post-Lookup Filtering
  // Only keep properties that have units matching the criteria (especially important if filtering by price/beds/baths)
  if (hasPriceFilter || query.bedrooms || query.bathrooms) {
    pipeline.push({ $match: { "units.0": { $exists: true } } });
  }

  // 4. Calculate Pricing Metrics & Unit Stats
  const salePrices = {
    $filter: { input: "$units.price.sale", as: "p", cond: { $gt: ["$$p", 0] } },
  };
  const rentPrices = {
    $filter: { input: "$units.price.rent", as: "p", cond: { $gt: ["$$p", 0] } },
  };

  pipeline.push({
    $addFields: {
      calculatedMinPrice: {
        $min: [{ $min: salePrices }, { $min: rentPrices }].filter(
          (v) => v !== undefined,
        ), // Note: Mongo will handle nulls in $min correctly
      },
      calculatedMaxPrice: {
        $max: [{ $max: "$units.price.sale" }, { $max: "$units.price.rent" }],
      },
      unitCount: { $size: "$units" },
      // Summary fields for bedrooms/bathrooms range
      bedsRange: {
        min: { $min: "$units.details.bedrooms" },
        max: { $max: "$units.details.bedrooms" },
      },
      bathsRange: {
        min: { $min: "$units.details.bathrooms" },
        max: { $max: "$units.details.bathrooms" },
      },
    },
  });

  // 5. Sorting Stage
  let sortStage: any = { createdAt: -1 };
  if (query.sortBy === "oldest") sortStage = { createdAt: 1 };
  if (query.sortBy === "priceLow") sortStage = { calculatedMinPrice: 1 };
  if (query.sortBy === "priceHigh") sortStage = { calculatedMaxPrice: -1 };
  if (query.sortBy === "featured")
    sortStage = { isFeatured: -1, createdAt: -1 };

  pipeline.push({ $sort: sortStage });

  // 6. Pagination with $facet
  const skip = (query.page - 1) * query.limit;
  pipeline.push({
    $facet: {
      metadata: [{ $count: "total" }],
      data: [{ $skip: skip }, { $limit: query.limit }],
    },
  });

  const [result] = await Property.aggregate(pipeline);

  return {
    success: true,
    properties: result.data,
    property: query.id || query.slug ? result.data[0] : undefined,
    total: result.metadata[0]?.total || 0,
    page: query.page,
    limit: query.limit,
  };
};

export default getProperties;
