import useFetch from '@/hooks/fetches/useFetch';
import { message, Switch } from 'antd';
import { useState } from 'react';

function Activate({
  id,
  isActive,
  onSuccess,
}: {
  id: string;
  isActive: boolean;
  onSuccess: any;
}) {
  const { Put, isLoading } = useFetch();
  const [active, setActive] = useState(isActive);
  const onActivate = async () => {
    try {
      const response = await Put({
        url: `/apps/activate/${id}`,
        body: { id },
      });
      setActive(!active);
      message.success(response);
      onSuccess();
    } catch (error: any) {
      message.error(error.message);
      setActive(isActive);
    }
  };
  return (
    <Switch
      loading={isLoading}
      checked={active}
      defaultChecked={isActive}
      onChange={onActivate}
      size='small'
    />
  );
}

export default Activate;
