import { Card } from '@/components/ui/card';
import { Button, Empty, Skeleton } from 'antd';

import StoreCard from '../components/StoreCard';

function StoresBox({
  isLoading,
  data,
  openModal,
  setState,
  getMenuItems,
}: {
  isLoading: boolean;
  data: {
    appName: string;
    total: number;
    data: any[];
  };
  openModal: () => void;
  setState: (state: { type: string; id: string }) => void;
  getMenuItems: any;
}) {
  const storeData = data?.data || [];
  return (
    <Card>
      {isLoading ? (
        <Skeleton paragraph={{ rows: 1 }} active />
      ) : (
        <header className='flex justify-between items-center'>
          <div className='space-y-1'>
            <h1 className='text-xl font-bold capitalize dark:text-white/85'>
              {data?.appName}s
            </h1>
            <p className='text-lg text-gray-500'>{` Stores (${data?.total})`}</p>
          </div>
          <Button
            onClick={() => {
              openModal();
              setState({ type: 'new', id: '' });
            }}
            type='primary'
          >
            Add Store
          </Button>
        </header>
      )}

      {isLoading ? (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-4 mt-2 pt-5 border-t-2'>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} active />
          ))}
        </div>
      ) : (
        <>
          {storeData?.length ? (
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-4 mt-2 pt-5 border-t-2'>
              {storeData.map((store: any, i) => (
                <div key={i}>
                  <StoreCard data={store} getMenuItems={getMenuItems} />
                </div>
              ))}
            </div>
          ) : (
            <div className='flex justify-center items-center w-full mt-2 pt-5 border-t-2'>
              <Empty description='No stores found' />
            </div>
          )}
        </>
      )}
    </Card>
  );
}

export default StoresBox;
