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

export function addVersion(ref: string): string {
  // Match something like "ST57246-3"
  const match = ref.match(/^(.*?)-(\d+)$/);

  if (match) {
    const base = match[1];
    const version = parseInt(match[2], 10) + 1;
    return `${base}-${version}`;
  } else {
    return `${ref}-1`;
  }
}
export default Generators;
