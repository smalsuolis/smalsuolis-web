import { useNavigate } from 'react-router';
import LoaderComponent from '../components/LoaderComponent';
import TokenPasswordCard from '../components/auth/TokenPasswordCard';
import TokenSuccessCard from '../components/auth/TokenSuccessCard';
import { PasswordForm } from '../utils';
import { useSetPassword, useVerifyUser } from '../utils/hooks';
import { slugs } from '../utils/routes';
import { buttonsTitles, descriptions, titles } from '../utils/texts';

// Reset-password flow from a "forgot password" email link ("Atkurti slaptažodį").
const ResetPassword = () => {
  const navigate = useNavigate();
  const { isLoading, data } = useVerifyUser();
  const {
    mutateAsync: setPasswordMutation,
    isSuccess,
    isLoading: isSubmitLoading,
  } = useSetPassword();

  if (isLoading) return <LoaderComponent />;

  const handleSubmit = (form: PasswordForm) => setPasswordMutation({ password: form.password });

  return !isSuccess ? (
    <TokenPasswordCard
      title={titles.resetPassword}
      submitLabel={buttonsTitles.reset}
      user={data?.user}
      isLoading={isSubmitLoading}
      onSubmit={handleSubmit}
    />
  ) : (
    <TokenSuccessCard
      title={titles.passwordChanged}
      message={descriptions.passwordChanged}
      actionLabel={buttonsTitles.login}
      onAction={() => navigate(slugs.login)}
    />
  );
};

export default ResetPassword;
