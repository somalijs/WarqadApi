import z from 'zod';

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  token: z.string().min(1),
  from: z.string().min(1),
  subject: z.string().min(1),
  company: z.string().min(1),
  title: z.string().min(1),
  message: z.string().min(1),
});
export type EmailVerificationType = z.infer<typeof schema>;
async function EmailVerificationTemplate(datas: EmailVerificationType) {
  const { name, email, token, from, subject, company, title, message } =
    schema.parse(datas);
  const year = new Date().getFullYear();
  const mailOptions = {
    from: from, // Sender email (must match SMTP user in production)
    to: email, // Receiver email
    subject: subject,
    html: `
          <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>${subject}</title>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: Arial, sans-serif; padding: 20px; display: flex; justify-content: center; }
                .container { display: flex; flex-direction: column; gap: 20px; max-width: 400px; text-align: center; }
                .title { font-size: 24px; font-weight: bold; text-transform: uppercase; }
                .subtitle { font-size: 20px; background: chocolate; color: white; padding: 10px; border-radius: 10px; }
                .user-info { font-size: 18px; color: black; }
                .message { font-size: 16px; color: gray; margin-top: 5px; margin-bottom: 10px; }
                .verification-code { border: 1px solid black; padding: 10px 15px; font-size: 30px; font-weight: bold; display: inline-block; letter-spacing: 2px; }
                .note { margin-top: 20px; font-size: 14px; }
                .footer { margin-top: 30px; font-size: 14px; color: gray; }
                .space{ margin-top: 20px;   }
                .center{ text-align: center; }
              </style>
            </head>
            <body>
              <main class="container">
                <header >
                  <h1 class="title center">${company}</h1>
                  <h2 class="subtitle space center">${title}</h2>
                </header>
                <p class="user-info  space">
                  <strong>Hello, </strong> ${name}
                </p>
                <section class="space">
                  <p class="message">${message}</p>
                  <div class="verification-code">${token}</div>
                </section>
                <p class="note">
                  If you did not request this, please ignore this message.
                </p>
                <footer class="footer">
                  &copy; ${year} Warqad Team. All rights reserved. 
                </footer>
              </main>
            </body>
          </html>
        `,
  };

  return mailOptions;
}
export default EmailVerificationTemplate;
