import { PasswordField, TextField } from '@aplinkosministerija/design-system';
import { useFormik } from 'formik';
import { useState } from 'react';
import styled from 'styled-components';
import { PasswordForm, User, inputLabels } from '../../utils';
import PasswordCheckListContainer from '../PasswordCheckListContainer';
import { device, font } from '../../styles';
import { SubmitButton } from './authModalStyles';

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
        <Footer>
          <SubmitButton loading={isLoading} disabled={disabled} type="submit">
            {submitLabel}
          </SubmitButton>
        </Footer>
      </Card>
    </Backdrop>
  );
};

export default TokenPasswordCard;

const Backdrop = styled.div`
  /* The layout centres its children, which makes them shrink to fit — without
     this the card never reaches its 499px. */
  width: 100%;
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
  max-width: 499px;
  background: ${({ theme }) => theme.colors.white};
  border-radius: 8px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.12);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;

  @media ${device.mobileL} {
    padding: 24px 16px;
  }

  label {
    ${font('base')};
    color: ${({ theme }) => theme.colors.text.primary};
    /* Design: 8px between a field's label and its box (the DS ships 4). */
    margin-bottom: 4px;
  }

  div:has(> input:not([type='checkbox'])) {
    height: 40px;
    border-radius: 100px;
    border-color: ${({ theme }) => theme.colors.grey[500]};
  }

  div:has(> input:not([type='checkbox'])) > input {
    height: 38px;
    padding: 0 12px;
  }

  /* The design paints a field's message and its hairline red when it fails. */
  div:has(> input:not([type='checkbox'])) + label {
    color: ${({ theme }) => theme.colors.text.error};
  }
  div:has(> input:not([type='checkbox'])):has(+ label) {
    border-color: ${({ theme }) => theme.colors.text.error};
  }
`;

const Title = styled.h2`
  ${font('2xl')};
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
`;

// Right-aligned on the 499 frame, full width on the 361 one.
const Footer = styled.div`
  display: flex;
  justify-content: flex-end;

  @media ${device.mobileL} {
    div:has(> button) {
      width: 100%;
    }
  }
`;
