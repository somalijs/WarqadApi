import z from 'zod';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import formConfig from '@/App/components/Form/formConfig';
import useFetch from '@/hooks/fetches/useFetch';
import FormSpinner from '@/Assets/FormSpinner';

import Button from '@/App/components/Buttons';
import Fields from '@/App/components/Fields/index';

import { message } from 'antd';

const details = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(30, 'Name must be at most 30 characters')
    .transform((val) => val.trim().toLowerCase()),

  host: z
    .string()
    .min(2, 'Subdomain must be at least 2 characters')
    .max(15, 'Subdomain must be at most 15 characters')
    .transform((val) => val.toLowerCase()), // sanitize lowercase
  type: z.enum(['private', 'family']),
});
type SchemaType = z.infer<typeof details>;
function Add({
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
  } = form;
  const { Post, isLoading } = useFetch();
  const onSubmit = async (data: SchemaType) => {
    try {
      await Post({
        url: '/apps/create',
        body: {
          ...data,
        },
        form,
      });
      message.success('App created successfully');
      reFetch();
      onClose();
    } catch (error: any) {
      message.error(error.message);
    }
  };

  return (
    <div>
      {isLoading && <FormSpinner />}

      <form
        onSubmit={handleSubmit(onSubmit, formConfig.onError)}
        className='space-y-4'
      >
        <Fields.Input name='name' label='Name' type='text' form={form} />
        <Fields.Input name='host' label='Host' type='text' form={form} />
        <Fields.Select
          name='type'
          label='Type'
          options={[
            { label: 'Private', value: 'private' },
            { label: 'Family', value: 'family' },
          ]}
          form={form}
          required
        />

        {errors.root && (
          <h1 className='text-red-500'>{errors.root?.message}</h1>
        )}
        <footer className='flex justify-end '>
          <Button.FormButton
            isLoading={isLoading}
            loadingText='Creating App...'
            className='!w-[200px] !h-[40px]'
            type='submit'
          >
            Create App
          </Button.FormButton>
        </footer>
      </form>
    </div>
  );
}

export default Add;
