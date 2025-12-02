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
  email: z.string().email('Please enter a valid email address'),
  newEmail: z.string().email('Please enter a valid email address'),
});

type SchemaType = z.infer<typeof details>;
function UpdateEmail({
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
    setValue,
    formState: { errors },
  } = form;
  const { Put, isLoading, Fetch, data: fetchData } = useFetch();
  const onSubmit = async (data: SchemaType) => {
    if (fetchData.newEmail === data.newEmail) {
      form.setError('root', {
        message:
          'New email already added, and a verification code has been sent to it',
      });
      return;
    }
    if (data.newEmail === data.email) {
      form.setError('root', {
        message: 'Cannot update to the same email',
      });
      return;
    }
    try {
      let url = '';
      if (profile === 'agent') url = `/agents/update-email/${id}`;
      if (profile === 'user') url = `/users/update-email/${id}`;
      await Put({
        url: url,
        body: {
          email: data.newEmail,
          app: app,
        },
        form,
      });
      message.success('Email updated successfully');
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
          id: id,
          app: app,
        },
      });
      setValue('email', response.email);
      if (response.newEmail && response.newEmail !== response.email)
        setValue('newEmail', response.newEmail);
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
        <Fields.Input
          name='newEmail'
          label='New Email'
          type='text'
          form={form}
        />

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
            Update Email
          </Button.FormButton>
        </footer>
      </form>
    </div>
  );
}

export default UpdateEmail;
