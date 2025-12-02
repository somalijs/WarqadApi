import z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import formConfig from '@/App/components/Form/formConfig';
import useFetch from '@/hooks/fetches/useFetch';
import FormSpinner from '@/Assets/FormSpinner';
import Button from '@/App/components/Buttons';
import Fields from '@/App/components/Fields/index';
import { useEffect } from 'react';
import { message } from 'antd';
import zodFields from '@/zod/Fields';
import { useParams } from 'react-router-dom';

const details = z.object({
  phone: zodFields.phone,
  newPhone: zodFields.phone,
});

type SchemaType = z.infer<typeof details>;
function UpdatePhone({
  reFetch,
  onClose,
  id,
  profile,
}: {
  reFetch: () => void;
  onClose: () => void;
  id: string;
  profile: 'agent' | 'user';
}) {
  const { app } = useParams();
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
    if (fetchData.phoneNumber === data.newPhone) {
      form.setError('root', {
        message:
          'New phone number already added, and a verification code has been sent to it',
      });
      return;
    }
    try {
      let url = '';
      if (profile === 'agent') url = `/agents/update-phone/${id}`;
      if (profile === 'user') url = `/users/update-phone/${id}`;
      await Put({
        url: url,
        body: { ...data.newPhone, app: app },

        form,
      });
      message.success('Phone number updated successfully');
      reFetch();
      onClose();
    } catch (error: any) {
      form.setError('root', { message: error.message });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      let url = '';
      if (profile === 'agent') url = `/agents/get`;
      if (profile === 'user') url = `/users/get`;
      const res = await Fetch({
        url: url,
        params: {
          id: id,
          app: app,
        },
      });
      if (res.phone) form.setValue('phone', res.phone);
    };

    fetchData();
  }, [id]);

  return (
    <div>
      {isLoading && <FormSpinner />}

      <form
        onSubmit={handleSubmit(onSubmit, formConfig.onError)}
        className='space-y-4'
      >
        <Fields.Phone
          name='phone'
          label='Phone'
          form={form}
          disabled
          defaultValue={fetchData?.phoneNumber || ''}
        />
        <Fields.Phone name='newPhone' label='New Phone' form={form} />
        {errors.root && (
          <h1 className='text-red-500'>{errors.root?.message}</h1>
        )}
        <footer className='flex justify-end '>
          <Button.FormButton
            isLoading={isLoading}
            loadingText='Updating Agent...'
            className='!w-[200px] !h-[40px]'
            type='submit'
          >
            Update PhoneNumber
          </Button.FormButton>
        </footer>
      </form>
    </div>
  );
}

export default UpdatePhone;
