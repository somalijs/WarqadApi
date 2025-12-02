import { Route } from 'react-router-dom';

import { AdminProtectedRoute } from '@/Guards';
import Apps from '../pages/apps/apps';

import AppPage from '../pages/apps/AppPage';
import Agents from '../pages/profiles/Agents';

const AdminRoutes = () => (
  <Route element={<AdminProtectedRoute />}>
    <Route path='/agents' element={<Agents />} />

    <Route path='/apps' element={<Apps />} />
    <Route path='/apps/:app' element={<AppPage />} />
  </Route>
);

export default AdminRoutes;
