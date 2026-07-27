import { Button, CheckBox, TextField } from '@aplinkosministerija/design-system';
import { useMutation } from '@tanstack/react-query';
import { useFormik } from 'formik';
import styled from 'styled-components';
import api from '../../utils/api';
import { getErrorMessage } from '../../utils/functions';
import { buttonsTitles, inputLabels, subtitle, titles, validationTexts } from '../../utils/texts';
import { ReactQueryError } from '../../utils/types';
import { forgotPasswordSchema } from '../../utils/validations';
import { font } from '../../styles';
import AuthModalShell from './AuthModalShell';
import { useAuthModal } from './AuthModalContext';
import AuthSuccess from './AuthSuccess';

const AGREE_TEXT =
  'Registruojantis sutinku, kad man būtų siunčiama aktuali informacija apie tai, kas įdomaus vyksta valstybėje';

// Register modal (Figma "Registracija"). Email + consent → on success shows the
// "check your email" confirmation. Cross-links to login.
const RegisterModal = () => {
  const { open, close } = useAuthModal();

  const handleError = ({ response }: ReactQueryError): any => {
    const text = getErrorMessage(response?.data?.type);
    if (text) setErrors({ email: text });
  };

  const handleSuccess = (response: { invalidUntil?: Date }) => {
    if (response?.invalidUntil) {
      setErrors({ email: validationTexts.tooFrequentRequest });
    }
  };

  const {
    mutateAsync,
    isPending: isLoading,
    data,
  } = useMutation({
    mutationFn: (params: { email: string }) =>
      api.registration({ ...params, email: params.email.toLocaleLowerCase() }),
    onError: handleError,
    onSuccess: handleSuccess,
  });

  const isSuccess = !!data && !(data as any)?.invalidUntil;

  const { values, errors, setFieldValue, handleSubmit, setErrors } = useFormik({
    initialValues: { email: '', agree: false },
    validateOnChange: false,
    validationSchema: forgotPasswordSchema,
    onSubmit: (vals) => mutateAsync({ email: vals.email }),
  });

  const handleType = (field: string, value: string | boolean) => {
    setFieldValue(field, value);
    setErrors({});
  };

  if (isSuccess) {
    return (
      <AuthSuccess
        onClose={close}
        email={values.email}
        message="išsiuntėme registracijos instrukciją"
      />
    );
  }

  return (
    <AuthModalShell title={titles.registration} onClose={close}>
      <Form noValidate onSubmit={handleSubmit}>
        <TextField
          value={values.email}
          type="email"
          name="email"
          error={errors.email as string}
          onChange={(v: string) => handleType('email', v)}
          label={inputLabels.email}
        />
        <CheckBox
          label={AGREE_TEXT}
          value={values.agree}
          error={!!errors?.agree}
          onChange={(v: boolean) => handleType('agree', v)}
        />
        <SubmitRow>
          <FootNote>
            {subtitle.hasRegistered}{' '}
            <Link onClick={() => open('login')}>{buttonsTitles.login}</Link>
          </FootNote>
          <SubmitButton loading={isLoading} disabled={isLoading} type="submit">
            {buttonsTitles.register}
          </SubmitButton>
        </SubmitRow>
      </Form>
    </AuthModalShell>
  );
};

export default RegisterModal;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
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
`;
