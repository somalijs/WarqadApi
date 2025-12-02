import { UnProtectedRoute } from '@/Guards';
import { Route } from 'react-router-dom';
import SignIn from '../auth/SignIn';

const UnProtected = () => (
  <Route element={<UnProtectedRoute />}>
    <Route path='/login' element={<SignIn />} />
  </Route>
);

export default UnProtected;
