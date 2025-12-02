import AuthStore from './auth';

function useAuth() {
  return AuthStore((state) => state);
}

export default useAuth;
