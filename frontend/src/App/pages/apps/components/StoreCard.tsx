import AntDropdown from '@/App/components/dropDowns/AntDropdown';
import Badge from '@/components/ui/badge/Badge';
import { EllipsisVertical } from 'lucide-react';

export type StockCardProps = {
  name: string;
  users: string;
  address: string;
  type: string;
  status: 'active' | 'inactive';
  isActive: boolean;
};

// Component rendering
const StoreCard = ({
  data,
  getMenuItems,
}: {
  data: StockCardProps;
  getMenuItems: any;
}) => {
  const { name, users, type, status, address } = data;
  const imgUrl = '/images/brand/brand-07.svg';
  return (
    <div className='rounded-2xl border border-gray-200 bg-white px-6 pb-5 pt-6 dark:border-gray-800 dark:bg-white/[0.03] h-full flex flex-col'>
      <header className='flex justify-between  mb-6 flex-1 '>
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10'>
            <img src={imgUrl} alt={name} />
          </div>
          <div>
            <h3 className='text-base font-semibold text-gray-800 dark:text-white/90 capitalize'>
              {name}
            </h3>
            <span className='block text-gray-500 text-theme-xs dark:text-gray-400 capitalize'>
              {address || type}
            </span>
          </div>
        </div>
        <AntDropdown
          data={data}
          dropDownList={getMenuItems}
          // preventCloseList={['resetPassword']}
        >
          <EllipsisVertical className='cursor-pointer hover:text-green-500' />
        </AntDropdown>
      </header>
      <div className='flex items-end justify-between'>
        <div>
          <h4 className='text-lg font-semibold text-gray-800 dark:text-white/90'>
            {users || 0} Users
          </h4>
        </div>
        <Badge
          variant='light'
          color={status === 'active' ? 'success' : 'error'}
        >
          {status}
        </Badge>
      </div>
    </div>
  );
};

export default StoreCard;
