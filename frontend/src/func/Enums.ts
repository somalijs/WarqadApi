const storeEnums = {
  retail: ['electronics', 'clothes', 'pharmacy'],
  services: ['travel agency', 'real estate'],
  website: ['static', 'business', 'e-commerce'],
};
const Enums = {
  roles: ['admin', 'manager', 'staff'],
  gender: ['male', 'female'],
  models: ['user', 'agent'],
  storeEnums: storeEnums,
  storeTypes: Object.keys(storeEnums) as Array<keyof typeof storeEnums>,
};
export default Enums;
