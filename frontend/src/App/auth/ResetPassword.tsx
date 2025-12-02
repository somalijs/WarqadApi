import { Link, useSearchParams } from 'react-router-dom';

import { z } from 'zod';
import Button from '../components/Buttons';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import Fields from '../components/Fields';
import { useEffect, useState } from 'react';
import useNavigateHook from '@/hooks/customs/useNavigateHook';
import PageMeta from '@/components/common/PageMeta';
import useFetch from '@/hooks/fetches/useFetch';
import FormSpinner from '@/Assets/FormSpinner';
import Errors from '../components/Errors';

const schema = z.object({
  passkey: z.string(),
  passkeyConfirm: z.string(),
});
type schemaType = z.infer<typeof schema>;
export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const {
    Put,
    isLoading: isCheckingToken,
    error: errorCheckingToken,
  } = useFetch();

  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const profile = searchParams.get('profile');

  const form = useForm<schemaType>({
    resolver: zodResolver(schema),
  });
  const [isLoading, setIsLoading] = useState(false);
  const { goToHome } = useNavigateHook();
  const {
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = form;
  const password = watch('passkey');
  const confirmPassword = watch('passkeyConfirm');
  const onSubmit = async (data: schemaType) => {
    if (password !== confirmPassword) {
      setError('passkeyConfirm', { message: 'Passwords do not match' });
      return;
    }
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await axios.put('/api/v1/agents/update-password', {
        password: data.passkey,
        token,
        email,
      });
      goToHome();
    } catch (err: any) {
      //   console.error('❌ Login error:', err.response?.data || err.message);
      setError('root', { message: err.response?.data?.message || err.message });
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    const fetchData = async () => {
      await Put({
        url: `/agents/verify-password-token`,
        body: { token, email },
      });
    };
    fetchData();
  }, [email, profile, token]);
  if (isCheckingToken) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <FormSpinner />
      </div>
    );
  }
  if (errorCheckingToken) {
    return <Errors.NotFound title={'Error'} description={errorCheckingToken} />;
  }
  return (
    <>
      <PageMeta
        title='Agent Reset Password Page'
        description='Warqad Agent Reset Password Page'
      />
      <main className='mt-20'>
        <div className='flex flex-col flex-1'>
          <div className='flex flex-col justify-center flex-1 w-full max-w-md mx-auto '>
            <div className='space-y-6 border-l-2 border-blue-950  pl-5'>
              <div className=''>
                <h1 className=' font-semibold  text-title-sm dark:text-white/90 sm:text-title-md font-bona text-blue-950'>
                  Warqad.com
                </h1>

                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  Please create a new password for your account
                </p>
              </div>
              <div className='w-full border-t border-gray-200 dark:border-gray-800'></div>
              <div>
                <form onSubmit={handleSubmit(onSubmit, (e) => console.log(e))}>
                  <div className='space-y-6'>
                    <div>
                      <Fields.PasswordInput
                        name='passkey'
                        form={form}
                        label='new Passkey'
                        placeHolder='new passkey'
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div>
                      <Fields.PasswordInput
                        name='passkeyConfirm'
                        form={form}
                        label='re-enter Passkey'
                        placeHolder='re-enter new passkey'
                        required
                        disabled={isLoading}
                      />
                    </div>
                    {errors.root && (
                      <p className='text-red-500 text-sm'>
                        {errors.root.message}
                      </p>
                    )}
                    <div className='flex items-center justify-between'>
                      <Link
                        to='/reset-password'
                        className='text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400'
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div>
                      <Button.FormButton
                        isLoading={isLoading}
                        className='text-2xl font-bona'
                        loadingText='Updating Password...'
                      >
                        Update Password
                      </Button.FormButton>
                    </div>
                  </div>
                </form>

                <div className='mt-5'>
                  <p className='text-sm font-normal font-bona text-end text-gray-700 dark:text-gray-400 sm:text-end'>
                    {/* Don&apos;t have an account? {''}
                <Link
                  to='/signup'
                  className='text-brand-500 hover:text-brand-600 dark:text-brand-400'
                >
                  Sign Up
                </Link> */}
                    by Bintzone
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
