import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();
const resend = new Resend(process.env.RESEND_API_KEY);

const ResendBox = async (datas: any) => {
  const { data, error } = await resend.emails.send(datas);
  if (error) {
    throw new Error(error.message || 'Email not sent');
  }
  return data;
};

export default ResendBox;
