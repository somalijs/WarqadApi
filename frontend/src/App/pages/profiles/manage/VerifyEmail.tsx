import z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import formConfig from '@/App/components/Form/formConfig';
import useFetch from '@/hooks/fetches/useFetch';
import FormSpinner from '@/Assets/FormSpinner';
import Button from '@/App/components/Buttons';
import Fields from '@/App/components/Fields/index';
import { useEffect, useState } from 'react';
import { message } from 'antd';
import { Statistic } from 'antd';
import { useParams } from 'react-router-dom';
const { Timer } = Statistic;

const details = z.object({
  email: z.string().email('Please enter a valid email address'),
  token: z.string('Please enter a valid token'),
});

type SchemaType = z.infer<typeof details>;
function VerifyEmail({
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
  const { app } = useParams();
  const { Put, isLoading, Fetch, data: fetchData } = useFetch();
  const [canResend, setCanResend] = useState(false);
  const onSubmit = async (data: SchemaType) => {
    try {
      let url = '';
      if (profile === 'agent') url = `/agents/verify-email/${id}`;
      if (profile === 'user') url = `/users/verify-email/${id}`;
      await Put({
        url: url,
        body: {
          token: data.token,
          id: fetchData._id,
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
  const fetches = async () => {
    let url = '';
    if (profile === 'agent') {
      url = '/agents/get';
    }
    if (profile === 'user') {
      url = '/users/get';
    }
    const response = await Fetch({
      url: url,
      params: {
        app: app,
        id: id,
      },
    });
    setValue('email', response.newEmail);
    const isExpired = new Date(response.resendAllowed) <= new Date();
    setCanResend(isExpired);
  };

  useEffect(() => {
    fetches();
  }, [id]);

  return (
    <div className=''>
      {isLoading && <FormSpinner />}

      <form onSubmit={handleSubmit(onSubmit, formConfig.onError)} className=''>
        <div className='space-y-3 mb-3'>
          <Fields.Input
            name='email'
            label='Email'
            type='text'
            form={form}
            disabled
          />
          <Fields.Input
            name='token'
            label='Verification Token'
            type='text'
            placeHolder='Enter the verification token that was sent the above email'
            form={form}
          />
        </div>
        <ResendBox
          id={id}
          fetches={fetches}
          fetchData={fetchData}
          canResend={canResend}
          profile={profile}
          setCanResend={setCanResend}
        />
        {errors.root && (
          <h1 className='text-red-500 my-3'>{errors.root?.message}</h1>
        )}

        <footer className='flex justify-end space-y-3 mt-3 '>
          <Button.FormButton
            isLoading={isLoading}
            loadingText='Verifying Email...'
            className='!w-[200px] !h-[40px]'
            type='submit'
          >
            Verify Email
          </Button.FormButton>
        </footer>
      </form>
    </div>
  );
}

function ResendBox({
  id,
  fetches,
  fetchData,
  canResend,
  setCanResend,
  profile,
}: {
  id: string;
  fetches: () => void;
  fetchData: any;
  canResend: boolean;
  setCanResend: any;
  profile: 'agent' | 'user';
}) {
  const { Put, isLoading } = useFetch();
  const { app } = useParams();
  const handleResend = async () => {
    try {
      let url = '';
      if (profile === 'agent') url = `/agents/resend-email-verification/${id}`;
      if (profile === 'user') url = `/users/resend-email-verification/${id}`;
      await Put({
        url: url,
        body: { app },
      });
      message.success('Verification token resend successfully');
      fetches();
    } catch (error: any) {
      message.error(error?.message || 'Failed to resend verification token');
    }
  };
  return (
    <>
      {isLoading && <FormSpinner />}
      {fetchData && fetchData?.resendAllowed && (
        <>
          <div className='flex items-center gap-1 flex-wrap'>
            <h1>Didn't receive the verification token or expired?</h1>

            {!canResend ? (
              <Timer
                type='countdown'
                // title='Time Remaining'
                value={fetchData.resendAllowed}
                className='!text-small'
                onFinish={() => setCanResend(true)}
                valueStyle={{ fontSize: '14px', color: 'blue' }}
              />
            ) : (
              <span
                onClick={handleResend}
                className='text-blue-500 cursor-pointer hover:underline'
              >
                Resend
              </span>
            )}
          </div>
        </>
      )}
    </>
  );
}
export default VerifyEmail;
