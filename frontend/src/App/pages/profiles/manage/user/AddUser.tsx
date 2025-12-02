import z from 'zod';
import zodFields from '@/zod/Fields';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import formConfig from '@/App/components/Form/formConfig';
import useFetch from '@/hooks/fetches/useFetch';
import FormSpinner from '@/Assets/FormSpinner';

import Button from '@/App/components/Buttons';
import Fields from '@/App/components/Fields/index';
import Enums from '@/func/Enums';
import { useEffect } from 'react';
import { message } from 'antd';
import FetchSelectors from '@/App/components/FetchSelectors';
import { useParams } from 'react-router-dom';

const details = z.object({
  name: z
    .string()
    .min(2, 'Name is required')
    .max(20, 'Name must be less than 20 characters'),
  surname: z
    .string()
    .min(2, 'Surname is required')
    .max(20, 'Surname must be less than 20 characters'),
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  role: zodFields.role,
  sex: zodFields.sex,
  phone: zodFields.phone.optional(),
  app: z.string().min(1, 'App is required'),
});

type SchemaType = z.infer<typeof details>;
function AddUser({
  reFetch,
  onClose,
}: {
  reFetch: () => void;
  onClose: () => void;
}) {
  const { app } = useParams();
  const form = useForm<SchemaType>({
    resolver: zodResolver(details),
    defaultValues: {
      app: app,
    },
    shouldUnregister: true,
  });
  const {
    handleSubmit,
    formState: { errors },
    watch,
  } = form;
  const { Post, isLoading } = useFetch();
  const onSubmit = async (data: SchemaType) => {
    try {
      await Post({
        url: '/users/create',
        body: {
          ...data,
          app: app,
        },
        form,
      });
      message.success('User added successfully');
      reFetch();
      onClose();
    } catch (error: any) {
      message.error(error.message);
    }
  };
  const phone = watch('phone');
  useEffect(() => {
    if (phone && !phone.number) {
      form.setValue('phone', undefined);
    }
  }, [phone]);
  useEffect(() => {
    if (app) {
      form.setValue('app', app);
    }
  }, [app]);
  return (
    <div>
      {isLoading && <FormSpinner />}

      <form
        onSubmit={handleSubmit(onSubmit, formConfig.onError)}
        className='space-y-4'
      >
        <FetchSelectors.App
          name='app'
          label='App'
          form={form}
          required
          disabled
          placeHolder='Select App'
        />
        <div className='grid gap-4 sm:grid-cols-2'>
          <Fields.Input
            name='name'
            label='Name'
            type='text'
            form={form}
            required
          />
          <Fields.Input
            name='surname'
            label='Surname'
            type='text'
            form={form}
            required
          />
          <Fields.Input
            name='email'
            label='Email'
            type='email'
            form={form}
            required
          />
          <Fields.Select
            name='role'
            label='Role'
            placeHolder='Select Role'
            options={Enums.roles.map((role) => ({
              value: role,
              label: role,
            }))}
            form={form}
            required
          />
          <Fields.Select
            name='sex'
            label='Sex'
            placeHolder='Select Sex'
            options={Enums.gender.map((gender) => ({
              value: gender,
              label: gender,
            }))}
            form={form}
            required
          />
          <Fields.Phone name='phone' label='Phone' form={form} />
        </div>
        {errors.root && (
          <h1 className='text-red-500'>{errors.root?.message}</h1>
        )}
        <footer className='flex justify-end '>
          <Button.FormButton
            isLoading={isLoading}
            loadingText='Adding User...'
            className='!w-[200px] !h-[40px]'
            type='submit'
          >
            Add User
          </Button.FormButton>
        </footer>
      </form>
    </div>
  );
}

export default AddUser;
