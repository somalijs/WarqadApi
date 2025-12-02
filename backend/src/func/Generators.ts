import { randomInt } from 'crypto';

type IdNumOptions = {
  ids?: string[];
  length?: number;
  prefix?: string;
};

const Generators = {
  IdNums: ({ ids = [], length = 6, prefix = 'un' }: IdNumOptions): string => {
    let id: string;
    do {
      // Generate random numeric string of the specified length
      const numericId = Array.from({ length }, () => randomInt(0, 10)).join('');

      // Concatenate the prefix and numeric ID
      id = prefix + numericId;
    } while (ids.includes(id));

    return id.toUpperCase();
  },
};

export default Generators;
