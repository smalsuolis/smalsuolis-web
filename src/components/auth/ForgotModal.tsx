import { TextField } from '@aplinkosministerija/design-system';
import { useMutation } from '@tanstack/react-query';
import { useFormik } from 'formik';
import api from '../../utils/api';
import { getErrorMessage } from '../../utils/functions';
import {
  buttonsTitles,
  inputLabels,
  inputPlaceholders,
  titles,
  validationTexts,
} from '../../utils/texts';
import { ReactQueryError } from '../../utils/types';
import { forgotPasswordSchema } from '../../utils/validations';
import AuthModalShell from './AuthModalShell';
import { useAuthModal } from './AuthModalContext';
import AuthSuccess from './AuthSuccess';
import { Form, SubmitButton, SubmitRow, TextLink } from './authModalStyles';

// Forgot-password modal (Figma "Pamiršote slaptažodį?"). Email → reset
// instructions; "Grįžti atgal" returns to the login modal. Success shows the
// shared "check your email" confirmation.
const ForgotModal = () => {
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
      api.remindPassword({ email: params.email.toLocaleLowerCase() }),
    onError: handleError,
    onSuccess: handleSuccess,
  });

  const isSuccess = !!data && !(data as any)?.invalidUntil;

  const { values, errors, setFieldValue, handleSubmit, setErrors } = useFormik({
    initialValues: { email: '' },
    validateOnChange: false,
    validationSchema: forgotPasswordSchema,
    onSubmit: (vals) => mutateAsync({ email: vals.email }),
  });

  const handleType = (field: string, value: string) => {
    setFieldValue(field, value);
    setErrors({});
  };

  if (isSuccess) {
    return (
      <AuthSuccess
        onClose={close}
        email={values.email}
        message="išsiuntėme prisijungimo instrukciją"
      />
    );
  }

  return (
    <AuthModalShell title={titles.forgotPassword} onClose={close}>
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
        <SubmitRow>
          <TextLink type="button" onClick={() => open('login')}>
            {buttonsTitles.back}
          </TextLink>
          <SubmitButton loading={isLoading} disabled={isLoading} type="submit">
            {buttonsTitles.resetPassword}
          </SubmitButton>
        </SubmitRow>
      </Form>
    </AuthModalShell>
  );
};

export default ForgotModal;
