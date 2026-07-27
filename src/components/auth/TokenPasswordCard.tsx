import { Button, PasswordField, TextField } from '@aplinkosministerija/design-system';
import { useFormik } from 'formik';
import { useState } from 'react';
import styled from 'styled-components';
import { PasswordForm, User, inputLabels } from '../../utils';
import PasswordCheckListContainer from '../PasswordCheckListContainer';
import { device, font } from '../../styles';

// Set-password card for the token flows reached from an email link — "Užbaikite
// registraciją" (create) and "Atkurti slaptažodį" (reset). Matches the auth
// modal look: a centered white card over a plain backdrop (there's no page
// behind on a fresh email-link visit). Email is shown disabled; the user sets a
// new password validated by the shared checklist.
const TokenPasswordCard = ({
  title,
  submitLabel,
  user,
  isLoading,
  onSubmit,
}: {
  title: string;
  submitLabel: string;
  user?: User;
  isLoading: boolean;
  onSubmit: (values: PasswordForm) => Promise<void>;
}) => {
  const [allValid, setAllValid] = useState(false);
  const { values, setFieldValue, handleSubmit, setErrors } = useFormik({
    initialValues: { password: '', repeatPassword: '' },
    onSubmit: (v) => onSubmit(v),
  });

  const handleType = (field: string, value: string) => {
    setFieldValue(field, value);
    setErrors({});
  };

  const disabled = isLoading || !allValid;

  return (
    <Backdrop>
      <Card noValidate onSubmit={handleSubmit}>
        <Title>{title}</Title>

        <TextField label={inputLabels.email} value={user?.email || ''} name="email" disabled />
        <PasswordField
          value={values.password}
          name="password"
          onChange={(v: string) => handleType('password', v)}
          label={inputLabels.newPassword}
        />
        <PasswordField
          value={values.repeatPassword}
          name="repeatPassword"
          onChange={(v: string) => handleType('repeatPassword', v)}
          label={inputLabels.repeatNewPassword}
        />
        <PasswordCheckListContainer
          setAllValid={setAllValid}
          password={values.password}
          repeatPassword={values.repeatPassword}
        />
        <SubmitButton loading={isLoading} disabled={disabled} type="submit">
          {submitLabel}
        </SubmitButton>
      </Card>
    </Backdrop>
  );
};

export default TokenPasswordCard;

const Backdrop = styled.div`
  min-height: calc(100vh - 72px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;

  @media ${device.mobileL} {
    padding: 16px;
  }
`;

const Card = styled.form`
  width: 100%;
  max-width: 480px;
  background: ${({ theme }) => theme.colors.white};
  border-radius: 16px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.12);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Title = styled.h2`
  ${font('2xl', 600)};
  margin: 0 0 4px;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const SubmitButton = styled(Button)`
  margin-top: 8px;
`;
