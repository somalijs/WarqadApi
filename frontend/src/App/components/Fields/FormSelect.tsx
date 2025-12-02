import type { UseFormReturn, Path, FieldValues } from 'react-hook-form';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import type { Option } from '@/components/form/Select';

type ChakraInputsProps<T> = {
  name: Path<T>;
  form: UseFormReturn<T extends FieldValues ? any : any>;
  label: string;
  placeHolder?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  defualtValue?: string | number | undefined;
  options: Option[];
};
function FormSelect<T>({
  name,
  form,
  label = 'undefined',
  placeHolder = '',
  disabled = false,
  options = [],
  required = false,
  className,
}: ChakraInputsProps<T>) {
  const nameI = name.split('.');
  const names: string = nameI.length > 1 ? nameI[1] : nameI[0];
  const {
    setValue,
    watch,
    clearErrors,
    formState: { errors },
  } = form;
  const message = errors?.[names ? names : name];
  const current = watch(name);

  const onHandler = (value: any) => {
    setValue(name, value.target.value);
    clearErrors(name);
  };

  return (
    <section className={className}>
      <div>
        <Label className='capitalize'>
          {label} {required && <span className='text-error-500'>*</span>}
        </Label>

        <Select
          options={options}
          onChange={onHandler}
          placeholder={placeHolder}
          className={`dark:bg-dark-900 ${
            disabled ? 'opacity-50 hover:cursor-not-allowed' : ''
          }`}
          required={required}
          value={current}
          disabled={disabled}
        />
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

export default FormSelect;
