import { CheckBox, TextField } from '@aplinkosministerija/design-system';
import { useMutation } from '@tanstack/react-query';
import { useFormik } from 'formik';
import api from '../../utils/api';
import { getErrorMessage } from '../../utils/functions';
import {
  buttonsTitles,
  inputLabels,
  inputPlaceholders,
  subtitle,
  titles,
  validationTexts,
} from '../../utils/texts';
import { ReactQueryError } from '../../utils/types';
import { forgotPasswordSchema } from '../../utils/validations';
import AuthModalShell from './AuthModalShell';
import { useAuthModal } from './AuthModalContext';
import AuthSuccess from './AuthSuccess';
import {
  Error as FieldError,
  FootNote,
  Form,
  Link,
  SubmitButton,
  SubmitRow,
} from './authModalStyles';
import styled from 'styled-components';

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
        <FieldGroup>
          <TextField
            value={values.email}
            type="email"
            name="email"
            placeholder={inputPlaceholders.email}
            error={errors.email as string}
            onChange={(v: string) => handleType('email', v)}
            label={inputLabels.email}
          />
          <CheckBox
            label={AGREE_TEXT}
            value={values.agree}
            onChange={(v: boolean) => handleType('agree', v)}
          />
          {!!errors?.agree && <FieldError>{errors.agree as string}</FieldError>}
        </FieldGroup>
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

// The design keeps the email field and its consent line as one 16px-gapped
// block, against the 24 between the modal's blocks.
const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;
