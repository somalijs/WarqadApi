import useFetch from '@/hooks/fetches/useFetch';
import { message, Switch } from 'antd';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

function Activate({
  id,
  isActive,
  onSuccess,
  profile,
}: {
  id: string;
  isActive: boolean;
  onSuccess: any;
  profile: 'agent' | 'user';
}) {
  const { app } = useParams();
  const { Put, isLoading } = useFetch();
  const [active, setActive] = useState(isActive);
  const onActivate = async () => {
    let url = '';
    if (profile === 'agent') url = `/agents/activate/${id}`;
    if (profile === 'user') url = `/users/activate/${id}`;
    try {
      const response = await Put({
        url: url,
        body: { id, app: profile === 'user' ? app : undefined },
      });
      setActive(response.isActive);
      message.success(response.message);
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
