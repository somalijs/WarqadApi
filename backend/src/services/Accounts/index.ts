import addAccount from './Add.js';
import editAccount from './Edit.js';
import getAccounts from './Get.js';
import deleteAccount from './Delete.js';
const Account = {
  create: addAccount,
  edit: editAccount,
  get: getAccounts,
  delete: deleteAccount,
};
export default Account;
