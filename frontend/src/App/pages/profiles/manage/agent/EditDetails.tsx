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
  role: zodFields.role,
  sex: zodFields.sex,
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
        url: `/agents/update-details/${id}`,
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

  useEffect(() => {
    const fetchData = async () => {
      const response = await Fetch({
        url: `/agents/get?id=${id}`,
      });
      setValue('name', response.name);
      form.setValue('surname', response.surname);
      form.setValue('role', response.role);
      form.setValue('sex', response.sex);
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
        <div className='grid gap-4 sm:grid-cols-2'>
          <Fields.Input name='name' label='Name' type='text' form={form} />
          <Fields.Input
            name='surname'
            label='Surname'
            type='text'
            form={form}
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
        </div>
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
            Update Details
          </Button.FormButton>
        </footer>
      </form>
    </div>
  );
}

export default EditDetails;
