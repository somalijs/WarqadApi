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

const details = z.object({
  name: z.string().min(2).max(20),
  surname: z.string().min(2).max(20),
  email: z.string().email('Invalid email address'),
  role: zodFields.role,
  sex: zodFields.sex,
  phone: zodFields.phone.optional(),
});

type SchemaType = z.infer<typeof details>;
function AddAgent({
  reFetch,
  onClose,
}: {
  reFetch: () => void;
  onClose: () => void;
}) {
  const form = useForm<SchemaType>({
    resolver: zodResolver(details),
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
        url: '/agents/create',
        body: {
          ...data,
        },
        form,
      });
      message.success('Agent added successfully');
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
  return (
    <div>
      {isLoading && <FormSpinner />}

      <form
        onSubmit={handleSubmit(onSubmit, formConfig.onError)}
        className='space-y-4'
      >
        <div className='grid gap-4 sm:grid-cols-2'>
          <Fields.Input name='name' label='Name' type='text' form={form} />
          <Fields.Input
            name='surname'
            label='Surname'
            type='text'
            form={form}
          />
          <Fields.Input name='email' label='Email' type='email' form={form} />
          <Fields.Select
            name='role'
            label='Role'
            placeHolder='Select Role'
            options={Enums.roles.map((role) => ({
              value: role,
              label: role,
            }))}
            form={form}
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
          />
          <Fields.Phone name='phone' label='Phone' form={form} />
        </div>
        {errors.root && (
          <h1 className='text-red-500'>{errors.root?.message}</h1>
        )}
        <footer className='flex justify-end '>
          <Button.FormButton
            isLoading={isLoading}
            loadingText='Adding Agent...'
            className='!w-[200px] !h-[40px]'
            type='submit'
          >
            Add Agent
          </Button.FormButton>
        </footer>
      </form>
    </div>
  );
}

export default AddAgent;
