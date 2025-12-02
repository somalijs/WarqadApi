import ResendBox from '../../../providers/Resend.js';
import PasswordResetTemplate, {
  ResetPasswordType,
} from '../../../templates/emails/PasswordReset.js';

const passwodToken = async (emailDetails: Omit<ResetPasswordType, 'from'>) => {
  try {
    const mailOptions = await PasswordResetTemplate({
      name: emailDetails.name,
      email: emailDetails.email,
      resetLink: emailDetails.resetLink,
      from: process.env.NOREPLY_EMAIL as string,
      subject: emailDetails.subject,
      company: emailDetails.company,
      title: emailDetails.title,
      message: emailDetails.message,
    });
    await ResendBox(mailOptions);
    //  console.log('Email sent:', info);
    return { ok: true, message: 'Email sent successfully' };
  } catch (error: any) {
    console.error('Error sending email:', error);
    return { ok: false, message: error.message || 'Failed to send email' };
  }
};
export default passwodToken;
