import z from 'zod';

const zodObject = {
  email: z.object({
    email: z.email(),
  }),
};

export default zodObject;
