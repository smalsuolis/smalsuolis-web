import { PasswordField, TextField } from '@aplinkosministerija/design-system';
import { useFormik } from 'formik';
import styled from 'styled-components';
import { useLogin } from '../../utils/hooks';
import { buttonsTitles, inputLabels, inputPlaceholders, subtitle, titles } from '../../utils/texts';
import { loginSchema } from '../../utils/validations';
import { getErrorMessage } from '../../utils';
import AuthModalShell from './AuthModalShell';
import { useAuthModal } from './AuthModalContext';
import { Error, FootNote, Form, Link, SubmitButton, SubmitRow, TextLink } from './authModalStyles';

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
        <PasswordGroup>
          <PasswordField
            value={values.password}
            name="password"
            placeholder={inputPlaceholders.password}
            onChange={(v: string) => handleType('password', v)}
            label={inputLabels.password}
            error={errors.password as string}
          />
          <TextLink type="button" onClick={() => open('forgot')}>
            {titles.forgotPassword}
          </TextLink>
        </PasswordGroup>

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

// The design groups the password field with its "forgot" link at 8px, against
// the 24 that separates the modal's blocks.
const PasswordGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;
