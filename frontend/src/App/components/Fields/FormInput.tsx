import type { UseFormReturn, Path, FieldValues } from 'react-hook-form';
import Label from '@/components/form/Label';
import { Input, InputNumber } from 'antd';

type ChakraInputsProps<T extends FieldValues> = {
  name: Path<T>;
  form: UseFormReturn<T>;
  type: 'text' | 'password' | 'number' | 'email';
  label: string;
  placeHolder?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  defualtValue?: string | number | undefined;
  min?: number;
  max?: number;
  autoComplete?: 'on' | 'off';
  inputClassName?: string;
};

function FormInput<T extends FieldValues>({
  name,
  form,
  type = 'text',
  label = 'undefined',
  placeHolder = '',
  disabled = false,
  className,
  inputClassName,
  required = false,
  min,
  max,
  autoComplete = 'off',
}: ChakraInputsProps<T>) {
  const nameI = name.split('.');
  const names: string = nameI.length > 1 ? nameI[1] : nameI[0];
  const {
    watch,
    setValue,
    clearErrors,
    formState: { errors },
  } = form;
  const message = errors?.[names ? names : name];

  let inputClasses = `h-11 !w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${className}`;

  if (disabled) {
    inputClasses += ` text-gray-500 border-gray-300 opacity-40 bg-gray-100 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 opacity-40`;
  } else {
    inputClasses += ` bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90  dark:focus:border-brand-800`;
  }

  return (
    <section className={className}>
      <div>
        <Label className='capitalize'>
          {label} {required && <span className='text-error-500'>*</span>}
        </Label>

        {type !== 'number' ? (
          <Input
            placeholder={placeHolder}
            className={`${inputClasses} ${inputClassName}`}
            type={type}
            value={watch(name) as any}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setValue(name, e.target.value as any);
              clearErrors(name);
              clearErrors('root');
            }}
            disabled={disabled}
            autoComplete={autoComplete}
            step='any'
            required={required}
          />
        ) : (
          <InputNumber
            size='large'
            className='!w-full'
            controls={false}
            value={watch(name) as any}
            precision={0}
            placeholder={placeHolder}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setValue(name, e as any);
              clearErrors(name);
              clearErrors('root');
            }}
            formatter={(value: React.ChangeEvent<HTMLInputElement>) =>
              value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''
            }
            parser={(value: any) => value?.replace(/,/g, '') ?? ''}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
              type === 'number' &&
              ['E', 'e', '+'].includes(e.key) &&
              e.preventDefault()
            }
            disabled={disabled}
            min={min ?? undefined}
            step='any'
            max={max ?? undefined}
            required={required}
          />
        )}
      </div>

      {message && (
        <p className='mt-1 text-red-500 text-sm'>
          {message.message === 'Required'
            ? 'This field is required'
            : (message.message as React.ReactNode)}
        </p>
      )}
    </section>
  );
}

export default FormInput;
