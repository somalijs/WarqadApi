import { ProtectedRoute } from '@/Guards';
import { Route } from 'react-router-dom';
import AppLayout from '../layout/AppLayout';
import Profile from '../auth/profile';
import AdminRoutes from './AdminRoutes';

const Protected = () => (
  <Route element={<ProtectedRoute />}>
    <Route element={<AppLayout />}>
      <Route path='/' element={<h1>aaa</h1>} />
      <Route path='/profile' element={<Profile />} />
      {AdminRoutes()}
    </Route>
  </Route>
);

export default Protected;
