import ResendBox from '../../../providers/Resend.js';
import EmailVerificationTemplate, {
  EmailVerificationType,
} from '../../../templates/emails/Verifications.js';

const Verification = async (
  emailDetails: Omit<EmailVerificationType, 'from'>
) => {
  try {
    const mailOptions = await EmailVerificationTemplate({
      name: emailDetails.name,
      email: emailDetails.email,
      token: emailDetails.token,
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
export default Verification;
