import useProfile from '@/hooks/boxes/useProfiles';

import Button from '@/App/components/Buttons';
import { ProfileTableColumnType } from '@/App/Tables/ProfileTable/ProfileTable';
import Activate from './manage/Activate';

import ModalBox from '@/App/components/Modal';

import { MenuProps } from 'antd';
import { useModalBox } from '@/hooks/customs/useModalBox';
import AntDropdown from '@/App/components/dropDowns/AntDropdown';
import { EllipsisVertical } from 'lucide-react';
import EditDetails from './manage/EditDetails';
import Add from './manage/Add';
import useNavigateHook from '@/hooks/customs/useNavigateHook';
import { Link } from 'react-router-dom';
import SecretKey from './components/SecretKey';
import Domains from './manage/Domains';
function Profiles() {
  const { navigate } = useNavigateHook();
  const { closeModal, state, openModal, setState } = useModalBox<{
    type?: string;
    id: string;
  }>();
  const getMenuItems = (datas: any): MenuProps['items'] => [
    {
      key: '1',
      label: 'App Manage Box',
      disabled: true,
    },
    {
      key: 'Open App',
      label: 'Open App',
      onClick: () => {
        navigate(`/apps/${datas._id}`);
      },
    },
    {
      key: 'Get Secret Key',
      label: 'Get Secret Key',
      onClick: () => {
        openModal();
        setState({
          type: 'key',
          id: datas,
        });
      },
    },
    {
      key: 'domains',
      label: 'Domains',
      onClick: () => {
        openModal();
        setState({
          type: 'domain',
          id: datas._id,
        });
      },
    },
    {
      type: 'divider',
    },
    {
      key: 'Edit Details',
      label: 'Edit Details',
      onClick: () => {
        openModal();
        setState({
          type: 'details',
          id: datas._id,
        });
      },
    },
  ];

  const columns: ProfileTableColumnType[] = [
    {
      key: 'name',
      header: 'Name',
      sort: true,
      render: (item: any) => (
        <Link
          className='text-blue-500 underline hover:text-blue-600'
          to={`/apps/${item._id}`}
        >
          {item.name}
        </Link>
      ),
    },

    {
      key: 'status',
      header: 'Status',
      sort: true,
      render: (item: any) => (
        <div className='flex items-center gap-2'>
          <h1
            className={
              item.status === 'active' ? 'text-green-500' : 'text-red-500'
            }
          >
            {item.status}
          </h1>
          <Activate
            id={item._id}
            isActive={item.isActive}
            onSuccess={reFetchData}
          />
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: any) => (
        <div className='flex gap-2'>
          <AntDropdown
            data={item}
            dropDownList={getMenuItems}
            // preventCloseList={['resetPassword']}
          >
            <EllipsisVertical size={16} className='cursor-pointer' />
          </AntDropdown>
        </div>
      ),
    },
  ];
  const { ProfileTable, reFetchData } = useProfile({
    columns: columns,
    url: `/apps/get`,
    v: 1,
  });

  return (
    <div>
      {state?.type === 'new' && (
        <ModalBox
          width={400}
          isOpen={true}
          onCancel={() => closeModal()}
          title={`Add new App`}
        >
          <Add onClose={closeModal} reFetch={reFetchData} />
        </ModalBox>
      )}
      {state?.type === 'details' && (
        <ModalBox
          width={400}
          isOpen={true}
          onCancel={() => closeModal()}
          title={`Edit App Details`}
        >
          <EditDetails
            onClose={closeModal}
            reFetch={reFetchData}
            id={state.id}
          />
        </ModalBox>
      )}
      {state?.type === 'key' && (
        <ModalBox
          width={500}
          isOpen={true}
          onCancel={() => closeModal()}
          title={`Get App Secret Key`}
        >
          <SecretKey data={state.id} />
        </ModalBox>
      )}
      {state?.type === 'domain' && (
        <ModalBox
          width={500}
          isOpen={true}
          onCancel={() => closeModal()}
          title={`Allowed Domains`}
        >
          <Domains reFetch={reFetchData} id={state.id} onClose={closeModal} />
        </ModalBox>
      )}
      <ProfileTable
        header={
          <Button.FormButton
            onClick={() => {
              openModal();
              setState({ type: 'new', id: '' });
            }}
            className='capitalize !w-fit'
          >{`Add App`}</Button.FormButton>
        }
      />
    </div>
  );
}

export default Profiles;
