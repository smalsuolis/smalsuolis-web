import { useNavigate } from 'react-router';
import LoaderComponent from '../components/LoaderComponent';
import TokenPasswordCard from '../components/auth/TokenPasswordCard';
import TokenSuccessCard from '../components/auth/TokenSuccessCard';
import { PasswordForm } from '../utils';
import { useSetPassword, useVerifyUser } from '../utils/hooks';
import { slugs } from '../utils/routes';
import { buttonsTitles, descriptions } from '../utils/texts';

// Set-password flow from a registration email link ("Užbaikite registraciją").
const CreatePassword = () => {
  const navigate = useNavigate();
  const { isLoading, data } = useVerifyUser();
  const {
    mutateAsync: setPasswordMutation,
    isSuccess,
    isLoading: isSubmitLoading,
  } = useSetPassword();

  if (isLoading) return <LoaderComponent />;

  const handlePassword = (form: PasswordForm) => setPasswordMutation({ password: form.password });

  return !isSuccess ? (
    <TokenPasswordCard
      title="Užbaikite registraciją"
      submitLabel={buttonsTitles.register}
      user={data?.user}
      isLoading={isSubmitLoading}
      onSubmit={handlePassword}
    />
  ) : (
    <TokenSuccessCard
      message={descriptions.passwordChanged}
      actionLabel={buttonsTitles.login}
      onAction={() => navigate(slugs.login)}
    />
  );
};

export default CreatePassword;
