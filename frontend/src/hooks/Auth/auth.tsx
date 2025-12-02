import { create } from 'zustand';

type User = {
  //details
  id: string;
  name: string;
  surname: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
  sex: 'male' | 'female';
  phoneNumber: string;
  phone: {
    dialCode: string;
    number: string;
  };
  status: 'active' | 'inactive';
  names: string;
  isActive: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  homePath: string;
};

type AuthState = {
  user: User | null;
  isFetched: boolean;
  isLoggedIn: boolean;
  setIsLoggedIn: (d: boolean) => void;
  setIsFetched: (d: boolean) => void;
  login: (user: User) => void;
  logout: () => void;
};

export const AuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  isFetched: false,
  setIsLoggedIn: (d) => set({ isLoggedIn: d }),
  setIsFetched: (d) => set({ isFetched: d }),
  login: (user) => set({ user }),
  logout: () => set({ user: null, isLoggedIn: false, isFetched: false }),
}));

export default AuthStore;
