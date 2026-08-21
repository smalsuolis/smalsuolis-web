import { Button, PasswordField, TextField } from '@aplinkosministerija/design-system';
import { useFormik } from 'formik';
import styled from 'styled-components';
import { useLogin } from '../../utils/hooks';
import { buttonsTitles, inputLabels, inputPlaceholders, subtitle, titles } from '../../utils/texts';
import { loginSchema } from '../../utils/validations';
import { getErrorMessage } from '../../utils';
import { font } from '../../styles';
import AuthModalShell from './AuthModalShell';
import { useAuthModal } from './AuthModalContext';

// Login modal (Figma "Prisijungimas"). Overlays the current page. Cross-links
// switch to the register/forgot modals; success closes the modal (the user
// context refetches and the app re-renders as logged-in).
const LoginModal = () => {
  const { open, close } = useAuthModal();
  const { mutateAsync: login, isPending, error } = useLogin();

  const { values, errors, setFieldValue, handleSubmit, setErrors } = useFormik({
    initialValues: { email: '', password: '', refresh: true },
    validateOnChange: false,
    validationSchema: loginSchema,
    onSubmit: async (vals) => {
      await login(vals);
      close();
    },
  });

  const errorMessage = error ? getErrorMessage((error as any)?.response?.data?.type) : null;

  const handleType = (field: string, value: string | boolean) => {
    setFieldValue(field, value);
    setErrors({});
  };

  return (
    <AuthModalShell title={titles.login} onClose={close}>
      <Form noValidate onSubmit={handleSubmit}>
        <TextField
          value={values.email}
          type="email"
          name="email"
          placeholder={inputPlaceholders.email}
          error={errors.email as string}
          onChange={(v: string) => handleType('email', v)}
          label={inputLabels.email}
        />
        <PasswordField
          value={values.password}
          name="password"
          placeholder={inputPlaceholders.password}
          onChange={(v: string) => handleType('password', v)}
          label={inputLabels.password}
          error={errors.password as string}
        />
        <ForgotLink onClick={() => open('forgot')}>{titles.forgotPassword}</ForgotLink>

        {!!errorMessage && <Error>{errorMessage}</Error>}

        <SubmitRow>
          <FootNote>
            {subtitle.hasNotRegistered}{' '}
            <Link onClick={() => open('register')}>{buttonsTitles.register}</Link>
          </FootNote>
          <SubmitButton loading={isPending} disabled={isPending} type="submit">
            {buttonsTitles.login}
          </SubmitButton>
        </SubmitRow>
      </Form>
    </AuthModalShell>
  );
};

export default LoginModal;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ForgotLink = styled.button`
  align-self: flex-start;
  ${font('base', 500)};
  text-decoration: underline;
  color: ${({ theme }) => theme.colors.text.primary};
  cursor: pointer;
`;

const SubmitRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 4px;
`;

const FootNote = styled.div`
  ${font('base')};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Link = styled.span`
  text-decoration: underline;
  cursor: pointer;
`;

const SubmitButton = styled(Button)`
  flex-shrink: 0;
  height: 40px;
  padding: 8px 24px;
  border-radius: 54px;
  background-color: ${({ theme }) => theme.colors.black};
  border-color: ${({ theme }) => theme.colors.black};
  color: ${({ theme }) => theme.colors.white};
  ${font('base')};

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.grey[700]};
    border-color: ${({ theme }) => theme.colors.grey[700]};
  }
`;

const Error = styled.div`
  ${font('base')};
  color: ${({ theme }) => theme.colors.text.error};
`;
