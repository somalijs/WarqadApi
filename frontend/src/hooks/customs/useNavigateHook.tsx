import { useNavigate } from 'react-router-dom';

const useNavigateHook = () => {
  const navigates = useNavigate();
  const goBack = () => {
    navigates(-1);
  };
  const navigate = (path: string) => {
    return navigates(path);
  };
  const goToHome = () => {
    navigates('/');
  };
  const goToLogin = () => {
    navigates('/login');
  };

  return { goBack, navigate, goToHome, goToLogin };
};

export default useNavigateHook;
