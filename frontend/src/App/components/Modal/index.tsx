import FormSpinner from '@/Assets/FormSpinner';
import { Divider, Modal } from 'antd';
import { SquareX } from 'lucide-react';
import React from 'react';

function ModalBox({
  isOpen,
  onCancel,
  loading,
  children,
  maskClosable = false,
  centered = false,
  title,
  className,
  width = 500,
}: {
  isOpen: boolean;
  onCancel: () => void;
  loading?: boolean;
  children: React.ReactNode;
  maskClosable?: boolean;
  centered?: boolean;
  title?: string;
  className?: string;
  width?: number;
}) {
  return (
    <Modal
      open={isOpen}
      onCancel={onCancel}
      footer={null}
      closable={false}
      width={width}
      className={`relative ${className} !z-999999999999999999`}
      centered={centered}
      maskClosable={maskClosable}
      rootClassName='custom-modal !z-999999999999999999'
    >
      {loading && <FormSpinner />}
      <div className='flex flex-col gap-4 p-4 !z-999999999999999999 '>
        <header className='flex justify-between items-center font-semibold'>
          <div className=''>{title ? title : ''}</div>

          <SquareX
            onClick={onCancel}
            className={`cursor-pointer hover:text-red-500 `}
          />
        </header>
        <Divider className=' !p-0 !m-0' />
        {children}
      </div>
    </Modal>
  );
}

export default ModalBox;
