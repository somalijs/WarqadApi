const storeEnums = {
  retail: ['electronics', 'clothes', 'pharmacy'],
  services: ['travel agency', 'real estate'],
  website: ['static', 'business', 'e-commerce'],
};
const Enums = {
  roles: ['admin', 'manager', 'staff'],
  gender: ['male', 'female'],
  models: [
    'user',
    'agent',
    'store',
    'customer',
    'supplier',
    'employee',
    'drawer',
    'package',
  ],
  logActions: [
    'create',
    'update',
    'delete',
    'login',
    'resend email verification',
    'verify email',
    'resend passkey token',
    'set new passkey',
  ],
  VerificationTypes: [
    'email-verification',
    'phone-verification',
    'password-reset',
  ],
  storeEnums: storeEnums,
  storeTypes: Object.keys(storeEnums) as Array<keyof typeof storeEnums>,
  // retailTypes: ['grocery', 'clothing', 'shoes', 'electronics'],
  currencies: ['KSH', 'USD', 'TZS', 'SSH'],
  taxTypes: ['exclusive', 'inclusive'],
  countries: ['Kenya', 'Tanzania', 'Somalia'],

  accountProfiles: ['customer', 'supplier', 'employee'] as const,
  fileStatus: ['pending', 'uploading', 'failed', 'done'],
};
export default Enums;
