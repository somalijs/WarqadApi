import Users from '../profiles/Users';
import Stores from './Stores';

const AppPage = () => {
  return (
    <div className='space-y-4'>
      <Stores />
      <Users />
    </div>
  );
};

export default AppPage;
