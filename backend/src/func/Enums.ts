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
  storeTypes: ['retail', 'services', 'travel agency', 'website'],
  websiteTypes: ['static', 'business', 'e-commerce'],
  // retailTypes: ['grocery', 'clothing', 'shoes', 'electronics'],
  currencies: ['KSH', 'USD', 'TZS', 'SSH'],
  taxTypes: ['exclusive', 'inclusive'],
  countries: ['Kenya', 'Tanzania', 'Somalia'],

  accountProfiles: ['customer', 'supplier', 'employee', 'drawer'],
  fileStatus: ['pending', 'uploading', 'failed', 'done'],
};
export default Enums;
