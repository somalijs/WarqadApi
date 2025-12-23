const storeEnums = {
  retail: ['electronics', 'clothes', 'pharmacy'],
  services: ['travel agency', 'real estate', 'invoice manager'],
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
  StoreType: ['retail', 'services', 'website'] as const,
  // retailTypes: ['grocery', 'clothing', 'shoes', 'electronics'],

  taxTypes: ['exclusive', 'inclusive'],
  countries: ['Kenya', 'Tanzania', 'Somalia'],

  accountProfiles: [
    'customer',
    'supplier',
    'employee',
    'broker',
    'drawer',
  ] as const,
  drawerTypes: ['drawer', 'bank'] as const,
  currencies: ['USD', 'KSH'] as const,
  fileStatus: ['pending', 'uploading', 'failed', 'done'],
  transactionTypes: [
    'adjustment',
    'payment',
    'money-transfer',
    'expenses',
  ] as const,
  adjustmentTypes: [
    'customer-broker-invoice',
    'broker-invoice',
    'supplier-invoice',
    'employee-invoice',
    'drawer-adjustment',
  ] as const,
  action: ['credit', 'debit'] as const,
};
export default Enums;
