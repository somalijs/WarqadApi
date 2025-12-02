import PageMeta from '../../components/common/PageMeta';
import AuthLayout from './AuthPageLayout';
import SignInForm from './SignInForm';

export default function SignIn() {
  return (
    <>
      <PageMeta
        title='Agent SignIn Page'
        description='Warqad Agent SignIn Page'
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
