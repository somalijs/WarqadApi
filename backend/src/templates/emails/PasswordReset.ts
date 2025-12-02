import z from 'zod';

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  resetLink: z.string().min(1), // reset password link
  from: z.string().min(1),
  subject: z.string().min(1),
  company: z.string().min(1),
  title: z.string().min(1),
  message: z.string().min(1),
});
export type ResetPasswordType = z.infer<typeof schema>;

async function ResetPasswordTemplate(datas: ResetPasswordType) {
  const { name, email, resetLink, from, subject, company, title, message } =
    schema.parse(datas);

  const year = new Date().getFullYear();

  const mailOptions = {
    from: from,
    to: email,
    subject: subject,
    html: `
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; display: flex; justify-content: center; background: #f9f9f9; }
            .container { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); max-width: 500px; width: 100%; text-align: center; }
            .title { font-size: 24px; font-weight: bold; text-transform: uppercase; }
            .subtitle { font-size: 20px; background: #007bff; color: white; padding: 10px; border-radius: 10px; margin-top: 10px; }
            .message { font-size: 16px; color: #333; margin-top: 15px; margin-bottom: 20px; }
            .button { display: inline-block; background: #007bff; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; font-weight: bold; }
            .fallback { margin-top: 20px; font-size: 14px; color: #555; }
            .fallback a { color: #007bff; word-break: break-word; }
            .footer { margin-top: 30px; font-size: 14px; color: gray; }
          </style>
        </head>
        <body>
          <main class="container">
            <header>
              <h1 class="title">${company}</h1>
              <h2 class="subtitle">${title}</h2>
            </header>
            <p><strong>Hello,</strong> ${name}</p>
            <p class="message">${message}</p>
            <a href="${resetLink}" class="button">Reset Password</a>
            <div class="fallback">
              <p>If the button above doesn't work, copy and paste the following link into your browser:</p>
              <a href="${resetLink}">${resetLink}</a>
            </div>
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

export default ResetPasswordTemplate;
