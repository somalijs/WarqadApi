type ChangedFields<T> = {
  old: Partial<T>;
  new: Partial<T>;
} | null;

function compareObjects<T extends Record<string, any>>({
  old,
  new: incoming,
}: {
  old: T;
  new: Partial<T>;
}): ChangedFields<T> {
  const changed = {
    old: {} as Partial<T>,
    new: {} as Partial<T>,
  };

  for (const key of Object.keys(incoming) as (keyof T)[]) {
    const newValue = incoming[key];
    const oldValue = old[key];

    if (typeof newValue !== 'undefined' && newValue !== oldValue) {
      changed.old[key] = oldValue;
      changed.new[key] = newValue;
    }
  }

  const hasChanges =
    Object.keys(changed.old).length > 0 || Object.keys(changed.new).length > 0;

  return hasChanges ? changed : null;
}

export default compareObjects;
