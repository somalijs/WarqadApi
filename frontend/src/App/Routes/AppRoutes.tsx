import { Route } from 'react-router-dom';

import { Guard } from '@/Guards';
import Protected from './Protected';
import UnProtected from './UnProtected';
import PublicRoutes from './Public';

const AppRoutes = () => (
  <>
    <Route element={<Guard />}>
      {UnProtected()}
      {Protected()}
      {PublicRoutes()}
    </Route>
  </>
);

export default AppRoutes;
