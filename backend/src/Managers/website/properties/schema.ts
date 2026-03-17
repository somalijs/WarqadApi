import { z } from "zod";
import Enums from "../../../func/Enums.js";

export const propertyCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  propertyType: z.enum(Enums.propertyTypes as unknown as [string, ...string[]]),
  listingType: z.enum(Enums.listingTypes as unknown as [string, ...string[]]),
  stories: z.number().optional(),
  currency: z.enum(Enums.currencies as unknown as [string, ...string[]]),
  location: z.object({
    address: z.string().min(1, "Address is required"),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    coordinates: z
      .object({
        type: z.literal("Point"),
        coordinates: z.array(z.number()).length(2),
      })
      .optional(),
  }),
  amenities: z.array(z.string()).optional(),
  isFeatured: z
    .string()
    .transform((val) => (val === "true" ? true : false))
    .optional(),
});

export const propertyUpdateSchema = propertyCreateSchema.partial().extend({
  id: z.string().min(1, "Property ID is required"),
});

export const propertyDeleteSchema = z.object({
  id: z.string().min(1, "Property ID is required"),
});

export const propertyUnitCreateSchema = z.object({
  property: z.string().min(1, "Parent property ID is required"),
  unitName: z.string().optional(),
  status: z
    .enum(Enums.propertyStatus as unknown as [string, ...string[]])
    .optional(),
  price: z
    .object({
      rent: z.number().default(0),
      sale: z.number().default(0),
    })
    .optional(),
  rentPeriod: z
    .enum(Enums.rentPeriods as unknown as [string, ...string[]])
    .optional(),
  details: z
    .object({
      bedrooms: z.number().optional(),
      bathrooms: z.number().optional(),
      area: z.number().optional(),
      areaUnit: z.string().default("sqm"),
    })
    .optional(),
  isFeatured: z.boolean().optional(),
});

export const propertyUnitUpdateSchema = propertyUnitCreateSchema
  .partial()
  .extend({
    id: z.string().min(1, "Unit ID is required"),
  });

export const propertyUnitDeleteSchema = z.object({
  id: z.string().min(1, "Unit ID is required"),
});

export const coverImageSchema = z.object({
  property: z.string().min(1, "Property ID is required"),
});
