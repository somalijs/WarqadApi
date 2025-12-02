import z from 'zod';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import formConfig from '@/App/components/Form/formConfig';
import useFetch from '@/hooks/fetches/useFetch';
import FormSpinner from '@/Assets/FormSpinner';

import Button from '@/App/components/Buttons';
import Fields from '@/App/components/Fields/index';
import Enums from '@/func/Enums';

import { message } from 'antd';
import zodFields from '@/zod/Fields';
import FetchSelectors from '@/App/components/FetchSelectors';
import { useParams } from 'react-router-dom';
import { useEffect } from 'react';

const details = z.object({
  name: z
    .string()
    .min(3)
    .max(25)
    .transform((val) => val.trim().toLowerCase()),
  type: z.enum(Enums.storeTypes as [string, ...string[]]),
  address: z.string().optional(),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional(),
  app: zodFields.objectId('App ID'),
  subType: z.string().min(1, 'Subtype is required'),
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
  const { app } = useParams();
  const form = useForm<SchemaType>({
    resolver: zodResolver(details),
    shouldUnregister: true,
    defaultValues: {
      app: app,
    },
  });
  const {
    handleSubmit,
    formState: { errors },
  } = form;
  const { Put, isLoading, Fetch } = useFetch();
  const onSubmit = async (data: SchemaType) => {
    const datas = data as any;
    if (!datas.address) delete datas.address;
    if (!datas.phoneNumber) delete datas.phoneNumber;
    if (!datas.email) delete datas.email;

    try {
      await Put({
        url: `/stores/update-details/${id}`,
        body: {
          ...datas,
        },
        params: {
          app: app,
        },
        form,
      });
      message.success('Store Details updated successfully');
      reFetch();
      onClose();
    } catch (error: any) {
      message.error(error.message);
    }
  };
  const type = form.watch('type');
  const SubTypeOptions = type === 'website' ? Enums.websiteTypes : [];
  useEffect(() => {
    if (app) {
      form.setValue('app', app);
    }
    const fetchData = async () => {
      const response = await Fetch({
        url: `/stores/get?id=${id}`,
        params: {
          app: app,
        },
      });

      form.setValue('name', response.name);
      form.setValue('type', response.type);
      form.setValue('address', response.address);
      form.setValue('phoneNumber', response.phoneNumber);
      form.setValue('email', response.email);
      form.setValue('subType', response.subType);
    };

    fetchData();
  }, [app, id]);

  return (
    <div>
      {isLoading && <FormSpinner />}

      <form
        onSubmit={handleSubmit(onSubmit, formConfig.onError)}
        className='space-y-4'
      >
        <FetchSelectors.App name='app' label='App' form={form} disabled />
        <div className='grid gap-4 sm:grid-cols-2'>
          <Fields.Input name='name' label='Name' type='text' form={form} />
          <Fields.Select
            name='type'
            label='Type'
            placeHolder='Select Type'
            options={Enums.storeTypes.map((type) => ({
              value: type,
              label: type,
            }))}
            form={form}
          />{' '}
          <Fields.Select
            name='subType'
            label='sub Type'
            placeHolder='Select sub Type'
            options={SubTypeOptions.map((type) => ({
              value: type,
              label: type,
            }))}
            form={form}
          />
          <Fields.Input name='email' label='Email' type='email' form={form} />{' '}
          <Fields.Input
            name='phoneNumber'
            label='Phone Number'
            type='text'
            form={form}
          />
          <Fields.Input
            name='address'
            label='Address'
            type='text'
            form={form}
          />
        </div>
        {errors.root && (
          <h1 className='text-red-500'>{errors.root?.message}</h1>
        )}
        <footer className='flex justify-end '>
          <Button.FormButton
            isLoading={isLoading}
            className='!w-[200px] !h-[40px]'
            type='submit'
          >
            Update Store Details
          </Button.FormButton>
        </footer>
      </form>
    </div>
  );
}

export default EditDetails;
