import z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import formConfig from '@/App/components/Form/formConfig';
import useFetch from '@/hooks/fetches/useFetch';
import FormSpinner from '@/Assets/FormSpinner';
import Button from '@/App/components/Buttons';

import { useEffect, useState } from 'react';
import { message, Button as ButtonAntd, Popconfirm } from 'antd';

import SimpleTable from '@/App/Tables/SimpleTable';
import Fields from '@/App/components/Fields';

const details = z.object({
  domain: z.string().min(1, 'Domain url is required'),
});
type SchemaType = z.infer<typeof details>;

function Domains({
  reFetch,
  onClose,
  id,
}: {
  reFetch: () => void;
  onClose: () => void;
  id: string;
}) {
  const [datas, setData] = useState<any[]>([]);

  const form = useForm<SchemaType>({
    resolver: zodResolver(details),
    shouldUnregister: true,
  });
  const {
    handleSubmit,

    formState: { errors },
  } = form;
  const { Put, isLoading, Fetch, data: fetchData } = useFetch();
  const onSubmit = async (data: SchemaType) => {
    try {
      await Put({
        url: `/apps/domains/${id}`,
        body: { action: 'add', domain: data.domain },

        form,
      });
      message.success('Domainadded successfully');
      reFetch();
      onClose();
    } catch (error: any) {
      form.setError('root', { message: error.message });
    }
  };
  const onRemove = async (data: any) => {
    try {
      await Put({
        url: `/apps/domains/${id}`,
        body: { action: 'remove', domain: data.name },

        form,
      });
      message.success('Domain removed successfully');
      reFetch();
      onClose();
    } catch (error: any) {
      form.setError('root', { message: error.message });
    }
  };
  const columns = [
    {
      key: 'name',
      header: 'Domain Url',
    },

    {
      key: 'action',
      header: 'Action',
      render: (item: any) => (
        <Popconfirm
          title='Remove Store Access'
          description='Are you sure to remove this domain url ?'
          onConfirm={() => onRemove(item)}
          okText='Yes'
          cancelText='No'
          okButtonProps={{ danger: true }}
        >
          <ButtonAntd size='small' variant='text' danger>
            Remove
          </ButtonAntd>
        </Popconfirm>
      ),
    },
  ];
  const fetchs = async () => {
    const res = await Fetch({
      url: `/apps/get`,
      params: {
        id: id,
      },
    });
    const domains = (res.domains || []).map((item: any) => ({ name: item }));

    setData(domains);
  };
  useEffect(() => {
    fetchs();
  }, [id]);

  return (
    <div>
      {isLoading && <FormSpinner />}
      <h1 className='font-semibold capitalize text-gray-800 dark:text-white/90 mb-2 underline'>
        {fetchData?.name} allowed Domains
      </h1>
      <form
        onSubmit={handleSubmit(onSubmit, formConfig.onError)}
        className='space-y-4'
      >
        <Fields.Input
          form={form}
          name='domain'
          label='Domain'
          type='text'
          placeHolder='domain Url e.g: example.com'
        />
        {errors.root && (
          <h1 className='text-red-500'>{errors.root?.message}</h1>
        )}
        <footer className='flex justify-end '>
          <Button.FormButton
            isLoading={isLoading}
            loadingText='Updating Access...'
            className='!w-[200px] !h-[40px]'
            type='submit'
          >
            Add Domain
          </Button.FormButton>
        </footer>
      </form>
      <div className=' mt-4'>
        <SimpleTable
          columns={columns}
          data={datas}
          header={
            <h1 className='text-lg font-semibold text-gray-800 dark:text-white/90'>
              Domains
            </h1>
          }
          // errorMessage='No stores found'
          reLoad={fetchs}
        />
      </div>
    </div>
  );
}

export default Domains;
