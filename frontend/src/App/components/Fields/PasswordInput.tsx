import type { UseFormReturn, Path, FieldValues } from 'react-hook-form';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import { EyeCloseIcon, EyeIcon } from '@/icons';
import { useState } from 'react';
type ChakraInputsProps<T> = {
  name: Path<T & FieldValues>;
  form: UseFormReturn<T & FieldValues>;
  label: string;
  placeHolder?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  inputClassName?: string;
};
function PasswordInput<T>({
  name,
  form,
  label = 'undefined',
  placeHolder = '',
  disabled = false,
  className,
  inputClassName,
  required = false,
}: ChakraInputsProps<T>) {
  const {
    register,
    formState: { errors },
  } = form;
  const path = String(name);

  // Support nested paths like "user.email"
  const fieldError =
    path.split('.').reduce((acc: any, key) => acc?.[key], errors) ?? undefined;
  const [showPassword, setShowPassword] = useState(false);
  const message = fieldError as { message?: string };
  return (
    <section className={className}>
      <div>
        <Label className='capitalize'>
          {label} {required && <span className='text-error-500'>*</span>}
        </Label>

        <div className='relative'>
          <Input
            placeholder={placeHolder}
            className={inputClassName}
            type={showPassword ? 'text' : 'password'}
            {...register(name)}
            disabled={disabled}
            autoComplete={'off'}
            required={required}
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            className='absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2'
          >
            {showPassword ? (
              <EyeIcon className='fill-gray-500 dark:fill-gray-400 size-5' />
            ) : (
              <EyeCloseIcon className='fill-gray-500 dark:fill-gray-400 size-5' />
            )}
          </span>
        </div>
      </div>

      {message && (
        <p className='mt-1 text-red-500 text-sm'>
          {message.message === 'Required'
            ? 'This field is required'
            : message.message}
        </p>
      )}
    </section>
  );
}

export default PasswordInput;
