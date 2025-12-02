import type { UseFormReturn, Path } from 'react-hook-form';
import Label from '@/components/form/Label';

import { useLayoutEffect, useMemo, useState } from 'react';
import { Spin, Select } from 'antd';

import useFetch from '@/hooks/fetches/useFetch';
type Option = {
  label: string;
  value: string;
  currency?: string;
  obj?: any;
};
type ChakraInputsProps<T> = {
  name: Path<T>;

  form: UseFormReturn<any>;
  label: string;
  placeHolder?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  none?: boolean;
  defualtValue?: string | number | undefined;
  obj?: Path<T>;
};
function App<T>({
  name,
  form,
  label = 'App',
  placeHolder = '',
  disabled = false,
  required = false,
  className,
  obj,
}: ChakraInputsProps<T>) {
  const { isLoading, Fetch, error: errorMessage } = useFetch();
  const nameI = name.split('.');
  const names: string = nameI.length > 1 ? nameI[1] : nameI[0];
  const {
    setValue,
    setError,
    clearErrors,
    watch,
    formState: { errors },
  } = form;

  const [data, setData] = useState<Option[]>([]);
  const message: any = errors?.[names ? names : name] || errorMessage;
  const [query, setQuery] = useState('');
  const onSelect = (value: Option) => {
    const objData = data.find((item: any) => item.value === value.value);
    if (obj && objData) setValue(obj as any, objData);
    setValue(name as any, value.value);

    clearErrors(name as any);
  };

  useLayoutEffect(() => {
    const fetch = async () => {
      const url = `/apps/get?select=true`;
      try {
        const res = await Fetch({
          url: url,
          v: 1,
          params: {
            query,
          },
        });
        clearErrors(name);
        clearErrors('root');
        setData(res);
      } catch (error: any) {
        setError(name, { message: error.message || 'No apps found' });
        setData([] as any);
      }
    };
    fetch();
  }, [query]);

  const options = useMemo(() => {
    const list = (data as any as Option[]) || [];
    return list;
  }, [data, query]);

  return (
    <>
      <section className={className}>
        <div className='relative'>
          <div className='flex items-center justify-between gap-2'>
            <Label className='capitalize'>
              {label} {required && <span className='text-error-500'>*</span>}
            </Label>{' '}
          </div>
          <Select
            showSearch
            size='large'
            value={watch(name as any)}
            placeholder={placeHolder}
            disabled={disabled}
            filterOption={false}
            className={` !h-[44px] w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 ${
              watch(name as any)
                ? 'text-gray-800 dark:text-white/90'
                : 'text-gray-400 dark:text-gray-400'
            } `}
            onKeyDown={(e) => {
              if ((e as any).key === 'Enter') {
                const tr = (e.target as HTMLElement).closest('tr');
                const qty = tr?.querySelector<HTMLInputElement>(
                  '.ant-input-number input'
                );
                qty?.focus();
              }
            }}
            onSearch={(v) => {
              const sanitized = (v ?? '').replace(/["']/g, '').trim();
              setQuery(sanitized);
            }}
            onChange={(val, option) => {
              const opt = option as unknown as Option;
              onSelect({ ...opt, label: opt.label, value: val as string });
            }}
            notFoundContent={isLoading ? <Spin size='small' /> : null}
            options={options}
            style={{ width: '100%' }}
          />
        </div>
        {message && (
          <p className='mt-1 text-red-500 text-sm'>
            {message.message === 'Required'
              ? 'This field is required'
              : message.message}
          </p>
        )}
      </section>
    </>
  );
}

export default App;
