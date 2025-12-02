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
import { useParams } from 'react-router-dom';

const details = z.object({
  passkey: z.string(),
  email: z.string().email('Please enter a valid email address'),
});

type SchemaType = z.infer<typeof details>;
function ResetPasskey({
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
  const form = useForm<SchemaType>({
    resolver: zodResolver(details),
    shouldUnregister: true,
  });
  const {
    handleSubmit,
    setValue,
    formState: { errors },
  } = form;
  const { Put, isLoading, Fetch, data: fetchData } = useFetch();
  const { app } = useParams();
  const onSubmit = async (data: SchemaType) => {
    try {
      let url = '';
      if (profile === 'agent') url = `/agents/reset-password/${id}`;
      if (profile === 'user') url = `/users/reset-password/${id}`;
      await Put({
        url: url,
        body: {
          passkey: data.passkey,
          id: fetchData?._id,
          app,
        },
        form,
      });
      message.success('Password reset sent to email');
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
      const response = await Fetch({
        url: url,
        params: {
          app,
          id: id,
        },
      });
      setValue('email', response.email);
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
        <Fields.Input
          name='email'
          label='Email'
          type='text'
          form={form}
          disabled
        />
        <Fields.PasswordInput
          name='passkey'
          label='Admin Passkey'
          form={form}
        />

        {errors.root && (
          <h1 className='text-red-500'>{errors.root?.message}</h1>
        )}
        <footer className='flex justify-end '>
          <Button.FormButton
            isLoading={isLoading}
            loadingText='Sending Reset Password Link...'
            className='!w-[250px] !h-[40px]'
            type='submit'
          >
            Send Reset Password Link
          </Button.FormButton>
        </footer>
      </form>
    </div>
  );
}

export default ResetPasskey;
