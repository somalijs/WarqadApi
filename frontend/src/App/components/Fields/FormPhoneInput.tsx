import Label from '@/components/form/Label';
import PhoneInputComponent from 'react-phone-input-2';
import { useEffect } from 'react';

type ChakraInputsProps = {
  name: string;
  form: any;
  label: string;
  placeHolder?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  defualtValue?: string | number | undefined;
  success?: boolean;
  error?: boolean;
  defaultValue?: string;
};

function FormPhoneInput({
  name,
  form,
  label = 'undefined',
  placeHolder = '',
  disabled = false,

  required = false,
  success = false,
  error = false,
  defaultValue,
  className,
}: ChakraInputsProps) {
  let inputClasses = `h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30`;

  if (disabled) {
    inputClasses += ` text-black border-gray-300 opacity-40 bg-gray-100 cursor-not-allowed dark:bg-gray-800 dark:text-gray-900 dark:border-gray-700`;
  } else if (error) {
    inputClasses += ` border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:text-error-400 dark:border-error-500 dark:focus:border-error-800`;
  } else if (success) {
    inputClasses += ` border-success-500 focus:border-success-300 focus:ring-success-500/20 dark:text-success-400 dark:border-success-500 dark:focus:border-success-800`;
  } else {
    inputClasses += ` bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800`;
  }

  const {
    setValue,
    clearErrors,

    formState: { errors },
  } = form;
  const err = errors?.[name];
  const message =
    err?.message || err?.number?.message || err?.dialCode?.message;

  const onPhoneChange = (value: string, data: any) => {
    const { dialCode } = data;
    const formattedDialCode = dialCode?.startsWith('+')
      ? dialCode
      : `+${dialCode}`;
    const phoneNumber = value?.replace(dialCode || '', '')?.trim();
    setValue(`${name}.dialCode`, formattedDialCode);
    setValue(`${name}.number`, phoneNumber);
    clearErrors(name);
    clearErrors('root');
  };

  useEffect(() => {
    if (setValue) {
      setValue(`${name}.dialCode`, '');
      setValue(`${name}.number`, '');
      clearErrors(name);
    }
  }, [clearErrors, name, setValue]);

  return (
    <section className={className}>
      <div>
        <Label className='capitalize'>
          {label} {required && <span className='text-error-500'>*</span>}
        </Label>
        <PhoneInputComponent
          placeholder={placeHolder}
          inputProps={{
            className: inputClasses,
          }}
          specialLabel=''
          country='ke'
          containerClass='w-full'
          buttonClass='border-none bg-transparent'
          dropdownClass='bg-white shadow-md border'
          value={defaultValue}
          disabled={disabled}
          onChange={onPhoneChange}
        />
      </div>

      {message && (
        <p className='mt-1 text-red-500 text-sm'>
          {message === 'Required' ? 'This field is required' : message}
        </p>
      )}
    </section>
  );
}

export default FormPhoneInput;
