import useProfile from '@/hooks/boxes/useProfiles';

import Button from '@/App/components/Buttons';
import { ProfileTableColumnType } from '@/App/Tables/ProfileTable/ProfileTable';
import Activate from './manage/Activate';

import ModalBox from '@/App/components/Modal';
import AddAgent from './manage/agent/AddAgent';
import { MenuProps, Tag } from 'antd';
import { useModalBox } from '@/hooks/customs/useModalBox';
import AntDropdown from '@/App/components/dropDowns/AntDropdown';
import { EllipsisVertical } from 'lucide-react';
import EditDetails from './manage/agent/EditDetails';
import UpdateEmail from './manage/UpdateEmail';
import UpdatePhone from './manage/UpdatePhone';
import VerifyEmail from './manage/VerifyEmail';
import ResetPasskey from './manage/ResetPasskey';

function Agents() {
  const Profile = 'agent';

  const { closeModal, state, openModal, setState } = useModalBox<{
    type?: string;
    id: string;
  }>();
  const getMenuItems = (datas: any): MenuProps['items'] => [
    {
      key: '1',
      label: 'Agent Manage Box',
      disabled: true,
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
    {
      key: 'Edit Phone',
      label: 'Change Phone Number',
      onClick: () => {
        setState({
          type: 'phone',
          id: datas._id,
        });
      },
    },
    {
      key: 'Change email',
      label: 'Update Email Address',
      onClick: () => {
        setState({
          type: 'email',
          id: datas._id,
        });
      },
    },

    {
      type: 'divider',
    },
    datas.newEmail && {
      key: 'verifyEmail',
      label: 'Verify  Email',
      onClick: () => {
        setState({ type: 'verifyEmail', id: datas._id });
      },
    },
    datas.isEmailVerified && {
      key: 'resetPassword',
      label: 'Send Reset Password Link to Email',
      onClick: () => {
        setState({ type: 'resetPassword', id: datas._id });
      },
    },
  ];

  const columns: ProfileTableColumnType[] = [
    { key: 'names', header: 'Name', sort: true },
    { key: 'sex', header: 'Sex', sort: true },
    {
      key: 'email',
      header: 'Email',
      render: (item) => {
        return (
          <h1 className='flex items-center gap-2'>
            {item.email}
            {item.isEmailVerified ? (
              <Tag color='success' className='text-sm'>
                Verified
              </Tag>
            ) : (
              <Tag color='error'>Not Verified</Tag>
            )}
          </h1>
        );
      },
    },
    { key: 'phoneNumber', header: 'Phone Number' },
    { key: 'role', header: 'Role' },
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
            profile={Profile}
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
    url: `/agents/get`,
    v: 1,
  });

  return (
    <div>
      {state?.type === 'new' && (
        <ModalBox
          width={800}
          isOpen={true}
          onCancel={() => closeModal()}
          title={`Add new Agent`}
        >
          <AddAgent onClose={closeModal} reFetch={reFetchData} />
        </ModalBox>
      )}
      {state?.type === 'details' && (
        <ModalBox
          width={800}
          isOpen={true}
          onCancel={() => closeModal()}
          title={`Edit Agent Details`}
        >
          <EditDetails
            onClose={closeModal}
            reFetch={reFetchData}
            id={state.id}
          />
        </ModalBox>
      )}
      {state?.type === 'email' && (
        <ModalBox
          width={500}
          isOpen={true}
          onCancel={() => closeModal()}
          title={`Edit Agent Details`}
        >
          <UpdateEmail
            onClose={closeModal}
            reFetch={reFetchData}
            id={state.id}
            profile={Profile}
          />
        </ModalBox>
      )}
      {state?.type === 'phone' && (
        <ModalBox
          width={500}
          isOpen={true}
          onCancel={() => closeModal()}
          title={`Edit ${Profile} Details`}
        >
          <UpdatePhone
            onClose={closeModal}
            reFetch={reFetchData}
            id={state.id}
            profile={Profile}
          />
        </ModalBox>
      )}
      {state?.type === 'verifyEmail' && (
        <ModalBox
          width={500}
          isOpen={true}
          onCancel={() => closeModal()}
          title={`Verify agent  Email`}
        >
          <VerifyEmail
            onClose={closeModal}
            reFetch={reFetchData}
            id={state.id}
            profile={Profile}
          />
        </ModalBox>
      )}
      {state?.type === 'resetPassword' && (
        <ModalBox
          width={500}
          isOpen={true}
          onCancel={() => closeModal()}
          title={`Send Reset Password Link to Agent Email`}
        >
          <ResetPasskey
            onClose={closeModal}
            reFetch={reFetchData}
            id={state.id}
            profile={Profile}
          />
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
          >{`Add ${Profile}`}</Button.FormButton>
        }
      />
    </div>
  );
}

export default Agents;
