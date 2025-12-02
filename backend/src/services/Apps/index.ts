import create from './Create.js';
import update from './update.js';
import activate from './activate.js';
import get, { getSecretkey } from './get.js';
import generateNewSecretKey from './SecretKey.js';
import Domains from './domains.js';
import Package from './packages/index.js';

const App = {
  create,
  update,
  activate,
  get,
  generateNewSecretKey: generateNewSecretKey,
  getSecretkey: getSecretkey,
  Domains: Domains,
  Package: Package,
};

export default App;
