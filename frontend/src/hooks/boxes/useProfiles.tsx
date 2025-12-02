import ProfileTableComponent from '@/App/Tables/ProfileTable/ProfileTable';
import useFetch from '../fetches/useFetch';
import { useLayoutEffect } from 'react';

const useProfile = ({
  type,
  columns,
  url,
  v = 1,
  params,
}: {
  type?: 'agent' | 'user';
  columns: any[];
  url: string;
  v: 1 | 2;
  params?: Record<string, any>;
}) => {
  const { data, isLoading, error, Fetch } = useFetch();
  const datas: any[] = data || [];
  const fetchData = async () => {
    await Fetch({
      url: url,
      v: v,
      //  delay: 4000,
      params: {
        profile: type ?? undefined,
        ...params,
      },
    });
  };
  useLayoutEffect(() => {
    fetchData();
  }, [type]);
  const reFetchData = () => {
    fetchData();
  };
  const ProfileTable = ({ header }: { header?: React.ReactNode }) => {
    return (
      <>
        <ProfileTableComponent
          header={header}
          columns={columns}
          data={datas}
          isLoading={isLoading}
          reLoad={reFetchData}
          errorMessage={typeof error === 'string' ? error : 'No data found'}
        />{' '}
      </>
    );
  };
  return {
    ProfileTable,
    reFetchData,
  };
};

export default useProfile;
