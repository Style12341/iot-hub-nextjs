import z from 'zod';
export const createDeviceFormSchema = z.object({
  name: z.string().nonempty(),
  