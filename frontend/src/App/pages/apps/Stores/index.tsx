import useFetch from '@/hooks/fetches/useFetch';
import { useLayoutEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MenuProps, message } from 'antd';

import { useModalBox } from '@/hooks/customs/useModalBox';
import ModalBox from '@/App/components/Modal';
import Add from './manage/Add';
import StoresBox from './StoresBox';
import EditDetails from './manage/EditDetails';

function Stores() {
  // get the app id from the url
  const { app } = useParams();
  const { closeModal, state, openModal, setState } = useModalBox<{
    type?: string;
    id: string;
  }>();
  const getMenuItems = (datas: any): MenuProps['items'] => [
    {
      key: '1',
      label: 'Store Manage Box',
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
  ];

  const { Fetch, isLoading, data } = useFetch();
  const fetchData = async () => {
    try {
      await Fetch({
        url: `/stores/get`,
        params: {
          app: app,
          obj: 'true',
        },
        v: 1,
      });
    } catch (error: any) {
      message.error(error.message);
    }
  };

  useLayoutEffect(() => {
    fetchData();
  }, [app]);

  return (
    <>
      {state?.type === 'new' && (
        <ModalBox
          width={800}
          isOpen={true}
          onCancel={() => closeModal()}
          title={`Add New Store`}
        >
          <Add onClose={closeModal} reFetch={fetchData} />
        </ModalBox>
      )}
      {state?.type === 'details' && (
        <ModalBox
          width={800}
          isOpen={true}
          onCancel={() => closeModal()}
          title={`Edit Store Details`}
        >
          <EditDetails onClose={closeModal} reFetch={fetchData} id={state.id} />
        </ModalBox>
      )}

      <StoresBox
        isLoading={isLoading}
        data={data}
        openModal={openModal}
        setState={setState}
        getMenuItems={getMenuItems}
      />
    </>
  );
}
export default Stores;
