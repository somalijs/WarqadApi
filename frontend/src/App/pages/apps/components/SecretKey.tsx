import FormSpinner from '@/Assets/FormSpinner';
import useFetch from '@/hooks/fetches/useFetch';
import { message } from 'antd';
import { useEffect, useState } from 'react';

function SecretKey({ data }: { data: any }) {
  const id = data?._id;
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [key, setKey] = useState<string | null>('');
  const { isLoading, Put, Fetch } = useFetch();

  const handleCopy = async (apiKey: any) => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopiedId(apiKey);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (e) {
      console.log(e);
      // Optionally handle error
    }
  };
  const onGenerate = async () => {
    try {
      const res = await Put({
        url: `/apps/new-secret-key/${id}`,
        body: {},
      });
      message.success('success');
      setKey(res.key);
    } catch (error: any) {
      const msg = error.message || 'Something went wrong';
      message.error(msg);
    }
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await Fetch({
          url: `/apps/get-secret-key/${id}`,
        });
        setKey(res);
      } catch (error: any) {
        message.error(error.message || 'Something went wrong');
      }
    };
    fetchData();
  }, [id]);
  return (
    <>
      {isLoading && <FormSpinner />}
      <div>
        <label className='mb-2 inline-block text-md font-semibold text-gray-700 dark:text-gray-400'>
          App ( {data?.name} ) ID
        </label>

        <div className='flex items-center gap-3 flex-wrap'>
          <div className='relative  flex-1'>
            <input
              value={id as any}
              type='id'
              id={'id'}
              className='dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full  rounded-lg border border-gray-300 bg-transparent py-3 pr-[90px] pl-4 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30'
              readOnly
            />
          </div>
        </div>
      </div>
      <div>
        <label className='mb-2 inline-block text-md font-semibold text-gray-700 dark:text-gray-400'>
          {'API Secret Key'}
        </label>

        <div className='flex items-center gap-3 flex-wrap'>
          <div className='relative  flex-1'>
            <input
              value={key as any}
              type='api'
              id={'key'}
              className='dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full  rounded-lg border border-gray-300 bg-transparent py-3 pr-[90px] pl-4 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30'
              readOnly
            />
            <button
              id={`key`}
              className='absolute top-1/2 right-0 inline-flex h-11 -translate-y-1/2 cursor-pointer items-center gap-1 rounded-r-lg border border-gray-300 py-3 pr-3 pl-3.5 text-sm font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'
              onClick={() => handleCopy(key)}
              disabled={copiedId === key}
            >
              {copiedId === key ? (
                <>
                  {/* Check icon */}
                  <svg
                    className='fill-current'
                    width='20'
                    height='20'
                    viewBox='0 0 20 20'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <path
                      fillRule='evenodd'
                      clipRule='evenodd'
                      d='M16.707 6.293a1 1 0 00-1.414 0L9 12.586l-2.293-2.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l7-7a1 1 0 000-1.414z'
                      fill='currentColor'
                    />
                  </svg>
                  <div id='copy-text'>Copied</div>
                </>
              ) : (
                <>
                  <svg
                    className='fill-current'
                    width='20'
                    height='20'
                    viewBox='0 0 20 20'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <path
                      fillRule='evenodd'
                      clipRule='evenodd'
                      d='M6.58822 4.58398C6.58822 4.30784 6.81207 4.08398 7.08822 4.08398H15.4154C15.6915 4.08398 15.9154 4.30784 15.9154 4.58398L15.9154 12.9128C15.9154 13.189 15.6916 13.4128 15.4154 13.4128H7.08821C6.81207 13.4128 6.58822 13.189 6.58822 12.9128V4.58398ZM7.08822 2.58398C5.98365 2.58398 5.08822 3.47942 5.08822 4.58398V5.09416H4.58496C3.48039 5.09416 2.58496 5.98959 2.58496 7.09416V15.4161C2.58496 16.5207 3.48039 17.4161 4.58496 17.4161H12.9069C14.0115 17.4161 14.9069 16.5207 14.9069 15.4161L14.9069 14.9128H15.4154C16.52 14.9128 17.4154 14.0174 17.4154 12.9128L17.4154 4.58398C17.4154 3.47941 16.52 2.58398 15.4154 2.58398H7.08822ZM13.4069 14.9128H7.08821C5.98364 14.9128 5.08822 14.0174 5.08822 12.9128V6.59416H4.58496C4.30882 6.59416 4.08496 6.81801 4.08496 7.09416V15.4161C4.08496 15.6922 4.30882 15.9161 4.58496 15.9161H12.9069C13.183 15.9161 13.4069 15.6922 13.4069 15.4161L13.4069 14.9128Z'
                      fill=''
                    />
                  </svg>
                  <div id='copy-text'>Copy</div>
                </>
              )}
            </button>
          </div>

          <div className='group relative inline-block'>
            <button
              onClick={onGenerate}
              className='inline-flex h-11 w-11 items-center justify-center rounded-lg border border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-400 '
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='20'
                height='20'
                viewBox='0 0 20 20'
                fill='none'
              >
                <path
                  d='M17.0436 8.11306C16.6282 6.56272 15.7128 5.19276 14.4395 4.21568C13.1661 3.2386 11.6059 2.70898 10.0009 2.70898C8.39585 2.70898 6.83566 3.2386 5.5623 4.21568C4.28894 5.19276 3.37357 6.56271 2.95816 8.11306C2.87345 8.42919 2.81944 8.65089 2.78711 8.80352M2.9559 11.8866C3.37131 13.437 4.28668 14.8069 5.56004 15.784C6.8334 16.7611 8.39359 17.2907 9.99862 17.2907C11.6037 17.2907 13.1638 16.7611 14.4372 15.784C15.7106 14.8069 16.6259 13.437 17.0414 11.8866C17.1278 11.5641 17.1826 11.3399 17.2152 11.1871M5.4327 7.49705L2.86544 8.94265L2.78711 8.80352M1.41992 6.37512L2.78711 8.80352M14.575 12.503L17.1422 11.0574L17.2152 11.1871M18.5877 13.6249L17.2152 11.1871'
                  stroke='currentColor'
                  strokeWidth='1.5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            </button>
            <div className='invisible absolute bottom-full left-1/2 z-9999 mb-2.5 -translate-x-1/2 opacity-0 transition-opacity duration-300 group-hover:visible group-hover:opacity-100'>
              <div className='relative '>
                <div className='rounded-lg bg-white px-3 py-2 text-xs font-medium whitespace-nowrap text-gray-700 shadow-xs dark:bg-[#1E2634] dark:text-white'>
                  Regenerate
                </div>
                <div className='absolute -bottom-1 left-1/2 h-3 w-4 -translate-x-1/2 rotate-45 bg-white dark:bg-[#1E2634]'></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default SecretKey;
