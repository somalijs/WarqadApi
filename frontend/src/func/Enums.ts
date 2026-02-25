const storeEnums = {
  retail: ["electronics", "clothes", "pharmacy", "cars", "shoes", "grocery"],
  services: ["travel agency", "real estate", "invoice manager"],
  website: ["static", "business", "e-commerce"],
  store: ["store"],
};
const Enums = {
  roles: ["admin", "manager", "staff"],
  gender: ["male", "female"],
  models: ["user", "agent"],
  storeEnums: storeEnums,
  storeTypes: Object.keys(storeEnums) as Array<keyof typeof storeEnums>,
  currencies: ["USD", "KSH", "CNY", "TZS"] as const,
};
export default Enums;
