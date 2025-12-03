import { Link } from 'react-router';

import { z } from 'zod';
import Button from '../components/Buttons';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import Fields from '../components/Fields';
import { useEffect, useState } from 'react';
import useNavigateHook from '@/hooks/customs/useNavigateHook';

const schema = z.object({
  email: z.string().email(),
  password: z.string(),
});
type schemaType = z.infer<typeof schema>;
export default function SignInForm() {
  const form = useForm<schemaType>({
    resolver: zodResolver(schema),
    defaultValues: {
      // email: 'support@warqad.com',
      // password: '826314',
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const { goToHome } = useNavigateHook();
  const {
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
  } = form;

  const onSubmit = async (data: schemaType) => {
    setIsLoading(true);
    try {
      // delay 2 seconds
      //  await new Promise((resolve) => setTimeout(resolve, 4000));
      await axios.post('/api/v1/agents/email-login', data);
      goToHome();
    } catch (err: any) {
      //   console.error('❌ Login error:', err.response?.data || err.message);
      setError('root', { message: err.response?.data?.message || err.message });
    } finally {
      setIsLoading(false);
    }
  };
  const email = form.watch('email');
  const password = form.watch('password');
  useEffect(() => {
    clearErrors('root');
  }, [email, password]);
  return (
    <div className='flex flex-col flex-1'>
      <div className='flex flex-col justify-center flex-1 w-full max-w-md mx-auto '>
        <div className='space-y-6 border-l-2 border-blue-950  pl-5'>
          <div className=''>
            <h1 className=' font-semibold  text-title-sm dark:text-white/90 sm:text-title-md font-bona text-blue-950'>
              Warqad.com
            </h1>
            <p className='text-lg text-gray-500 dark:text-gray-400'>
              Agent Sign In
            </p>
            <p className='text-sm text-gray-500 dark:text-gray-400'>
              Enter your email and password to sign in!
            </p>
          </div>
          <div className='w-full border-t border-gray-200 dark:border-gray-800'></div>
          <div>
            <form onSubmit={handleSubmit(onSubmit, (e) => console.log(e))}>
              <div className='space-y-6'>
                <div>
                  <Fields.Input
                    name='email'
                    form={form}
                    label='Email'
                    type='email'
                    placeHolder='Please enter your email'
                    required
                    autoComplete='on'
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Fields.PasswordInput
                    name='password'
                    form={form}
                    label='Password'
                    placeHolder='Please enter your password'
                    required
                    disabled={isLoading}
                  />
                </div>
                {errors.root && (
                  <p className='text-red-500 text-sm'>{errors.root.message}</p>
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
                    loadingText='Authenticating...'
                  >
                    Sign in
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
  );
}
