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

const details = z.object({
  name: z
    .string()
    .min(2)
    .max(15)
    .transform((val) => val.trim().toLowerCase()),
});
type SchemaType = z.infer<typeof details>;
function EditDetails({
  reFetch,
  onClose,
  id,
}: {
  reFetch: () => void;
  onClose: () => void;
  id: string;
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
  const { Put, isLoading, Fetch } = useFetch();
  const onSubmit = async (data: SchemaType) => {
    try {
      await Put({
        url: `/apps/update/${id}`,
        body: {
          ...data,
        },
        form,
      });
      message.success('App updated successfully');
      reFetch();
      onClose();
    } catch (error: any) {
      message.error(error.message);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const response = await Fetch({
        url: `/apps/get?id=${id}`,
      });
      setValue('name', response.name);
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
        <Fields.Input name='name' label='Name' type='text' form={form} />

        {errors.root && (
          <h1 className='text-red-500'>{errors.root?.message}</h1>
        )}
        <footer className='flex justify-end '>
          <Button.FormButton
            isLoading={isLoading}
            loadingText='Updating App...'
            className='!w-[200px] !h-[40px]'
            type='submit'
          >
            Update App
          </Button.FormButton>
        </footer>
      </form>
    </div>
  );
}

export default EditDetails;
