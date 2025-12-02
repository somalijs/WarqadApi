import bcrypt from 'bcrypt';
import crypto from 'crypto';

export const passwordEncryption = {
  generate: async function () {
    const password = generateRandomToken(6);
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    return {
      hash,
      password,
    };
  },
  hash: async function (password: string) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  },
  compare: async function (password: string, hash: string) {
    return await bcrypt.compare(password, hash);
  },
  generatePasskeyToken: async function () {
    // Generate multiple random parts
    const part1 = crypto.randomBytes(8).toString('hex'); // e.g., prefix
    const part2 = crypto.randomBytes(8).toString('hex'); // e.g., noise
    const realToken = crypto.randomBytes(32).toString('hex'); // actual reset token

    // Build composite token
    const resetToken = `${part1}.${part2}.${realToken}`;

    // Hash only the last part (real token) for DB storage
    const hashedToken = crypto
      .createHash('sha256')
      .update(realToken)
      .digest('hex');
    return {
      token: resetToken,
      hash: hashedToken,
      expire: Date.now() + 72 * 60 * 60 * 1000,
    };
  },
  verifyPasskeyToken: async function ({
    token,
    hash,
  }: {
    token: string;
    hash: string;
  }) {
    // Extract last part (real token)
    const parts = token.split('.');
    const realToken = parts[parts.length - 1];

    // Hash the real token
    const hashedToken = crypto
      .createHash('sha256')
      .update(realToken)
      .digest('hex');

    // Compare with stored hash
    return hashedToken === hash;
  },
};

export const codeEncryption = {
  generateOtp: async function (length = 5) {
    const code = generateRandomToken(length);
    const hash = await bcrypt.hash(code, await bcrypt.genSalt(10));

    return {
      hash,
      code,
      expire: Date.now() + 72 * 60 * 60 * 1000,
    };
  },

  validateOtp: async function (code: string, hash: string) {
    return await bcrypt.compare(code, hash);
  },
};
function generateRandomToken(length = 5) {
  // const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const numbers = '0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  return token;
}

const ALGO = 'aes-256-ecb'; // deterministic, no IV needed

export const secretKeyManager = {
  // 1️⃣ Create a new random key
  create() {
    if (!process.env.MASTER_SECRET)
      throw new Error('MASTER_SECRET not set in .env');
    const masterSecret = process.env.MASTER_SECRET;

    const key = crypto.randomBytes(16).toString('hex'); // random key
    const encrypted = this.encrypt(key, masterSecret);

    return { key, encrypted }; // store only encrypted in DB
  },

  // 2️⃣ Reveal key from encrypted
  reveal(encrypted: string) {
    if (!process.env.MASTER_SECRET)
      throw new Error('MASTER_SECRET not set in .env');
    return this.decrypt(encrypted, process.env.MASTER_SECRET);
  },

  // 3️⃣ Verify candidate key against stored encrypted
  verify({ key, encrypted }: { key: string; encrypted: string }) {
    const encryptedCandidate = this.encrypt(key, process.env.MASTER_SECRET!);
    return encryptedCandidate === encrypted;
  },

  // 🔒 Internal encrypt/decrypt helpers
  encrypt(text: string, masterSecret: string) {
    const derivedKey = crypto
      .createHash('sha256')
      .update(masterSecret)
      .digest();
    const cipher = crypto.createCipheriv(ALGO, derivedKey, null);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  },

  decrypt(encrypted: string, masterSecret: string) {
    const derivedKey = crypto
      .createHash('sha256')
      .update(masterSecret)
      .digest();
    const decipher = crypto.createDecipheriv(ALGO, derivedKey, null);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  },
};
