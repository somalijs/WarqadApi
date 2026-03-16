import { z } from "zod";

export const requestCallSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  property: z.string().optional(),
  unit: z.string().optional(),
  message: z.string().min(1, "Message content is required"),
});

export const deleteClientSchema = z.object({
  id: z.string().min(1, "Client ID is required"),
});
