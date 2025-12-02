export interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  placeholder?: string;
  onChange: (value: any) => void;
  className?: string;
  defaultValue?: string;
  required?: boolean;
  loading?: boolean;
  value?: any;
  disabled?: boolean;
}

const Select: React.FC<SelectProps> = ({
  options,
  placeholder = 'Select an option',
  onChange,
  className = '',
  value = '',
  required = false,
  loading = false,
  disabled = false,
}) => {
  // Manage the selected value

  return (
    <select
      className={`h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 ${
        value
          ? 'text-gray-800 dark:text-white/90'
          : 'text-gray-400 dark:text-gray-400'
      } ${className}`}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
    >
      {/* Placeholder option */}
      <option
        value=''
        disabled
        className='text-gray-700 dark:bg-gray-900 dark:text-gray-400 opacity-75 bg-gray-200 '
      >
        {loading ? 'Loading...' : placeholder}
      </option>
      {/* Map over options */}
      {options.map((option, index) => (
        <option
          key={index}
          value={option.value}
          className='text-gray-700 dark:bg-gray-900 dark:text-gray-400'
        >
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default Select;
