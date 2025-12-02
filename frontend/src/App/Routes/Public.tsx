import { Route } from 'react-router-dom';

import ResetPassword from '../auth/ResetPassword';

const PublicRoutes = () => (
  <>
    <Route path='/reset-password' element={<ResetPassword />} />
  </>
);

export default PublicRoutes;
