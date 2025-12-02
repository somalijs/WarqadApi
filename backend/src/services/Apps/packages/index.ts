import addPackage from './create.js';
import deletePackage from './Delete.js';
import getPackages from './get.js';
import replacePackage from './Replace.js';

const Package = {
  add: addPackage,
  get: getPackages,
  replace: replacePackage,
  delete: deletePackage,
};

export default Package;
