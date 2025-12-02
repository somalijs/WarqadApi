import { useState } from 'react';
import axios from 'axios';
interface FetchProps {
  url: string;
  body: any;
  v?: 1 | 2;
  params?: Record<string, any>;
  delay?: number;
  form?: any;
}
const useFetch = () => {
  const [data, setData] = useState<any>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const Fetch = async ({
    url,
    v = 1,
    params,
    delay,
  }: Omit<FetchProps, 'body'>) => {
    setIsLoading(true);
    try {
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
      const response = await axios.get(`/api/v${v}${url}`, {
        withCredentials: true,
        params,
      });
      setData(response.data);
      return response.data;
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||
        error?.message ||
        'Something went wrong';

      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };
  const Post = async ({ url, v = 1, body, form }: FetchProps) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`/api/v${v}${url}`, body, {
        withCredentials: true,
      });
      setData(response.data);

      return response.data;
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||
        error?.message ||
        'Something went wrong';
      setError(errorMsg);
      if (form) {
        if (errorMsg !== 'zodError') {
          form.setError('root', { message: errorMsg });
        } else {
          const errors = error?.response?.data?.errors || [];

          errors.forEach((error: any) => {
            form.setError(error.field, { message: error.message });
          });
        }
      }
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };
  const Put = async ({ url, v = 1, body }: FetchProps) => {
    setIsLoading(true);
    try {
      const response = await axios.put(`/api/v${v}${url}`, body, {
        withCredentials: true,
      });
      setData(response.data);
      return response.data;
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||
        error?.message ||
        'Something went wrong';

      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };
  return {
    data,
    isLoading,
    error,
    Fetch,
    Post,
    Put,
  };
};

export default useFetch;
