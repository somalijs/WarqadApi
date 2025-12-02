import Button from '@/components/ui/button/Button';
import { Spin } from 'antd';
function FormButton({
  children,
  isLoading = false,
  disabled = false,
  className = '',
  loadingText = '',
  onClick,
  type = 'submit',
}: {
  children: React.ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  loadingText?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}) {
  return (
    <Button
      onClick={onClick}
      type={type}
      className={`${className} !h-[50px] w-full flex items-center justify-center gap-3 ${
        isLoading || disabled ? 'opacity-50 cursor-not-allowed ' : ''
      }`}
      size='sm'
      disabled={isLoading || disabled}
    >
      {isLoading && <Spin size='small' />}{' '}
      {isLoading && loadingText ? loadingText : children}
    </Button>
  );
}

export default FormButton;
