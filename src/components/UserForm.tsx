import { ContentLayout, TextField } from '@aplinkosministerija/design-system';
import { buttonsTitles, inputLabels, PasswordForm, useGetCurrentRoute, User } from '../utils';
import PasswordCheckListContainer from './PasswordCheckListContainer';
import styled from 'styled-components';
import { Button, PasswordField } from '@aplinkosministerija/design-system';
import { useFormik } from 'formik';
import { useState } from 'react';
import { ButtonVariants, device } from '../styles';

const SuccessIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="10" cy="10" r="10" fill="currentColor" />
    <path
      d="M6 10.2l2.6 2.6L14.2 7.2"
      stroke="#fff"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ErrorIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M9.14 2.5a1 1 0 0 1 1.72 0l8 13.5a1 1 0 0 1-.86 1.5H2a1 1 0 0 1-.86-1.5l8-13.5z"
      fill="currentColor"
    />
    <rect x="9" y="7" width="2" height="5" rx="1" fill="#fff" />
    <rect x="9" y="13.5" width="2" height="2" rx="1" fill="#fff" />
  </svg>
);

const UserForm = ({
  user,
  onSubmit,
  isLoading,
  initialValues,
  error,
  success,
  title,
}: {
  user?: User;
  onSubmit: (values: PasswordForm) => Promise<void>;
  isLoading: boolean;
  initialValues: {
    password: string;
    repeatPassword: string;
    oldPassword?: string;
  };
  error?: string | null;
  success?: string | null;
  title?: string;
}) => {
  const currentRoute = useGetCurrentRoute();
  const [allValid, setAllValid] = useState(false);
  const { values, setFieldValue, handleSubmit, setErrors } = useFormik({
    initialValues,
    onSubmit: (values) => {
      onSubmit(values);
    },
  });
  const handleType = (field: string, value: string | boolean) => {
    setFieldValue(field, value);
    setErrors({});
  };
  const { repeatPassword, password } = values;

  const updatingPassword = values.oldPassword !== undefined;

  const disableSubmit = isLoading || !allValid || (updatingPassword && !values.oldPassword);

  const heading = title ?? currentRoute?.title;

  return (
    <ContentLayout currentRoute={currentRoute}>
      <PasswordContainer noValidate onSubmit={handleSubmit}>
        <Header>
          {heading && <Title>{heading}</Title>}
          {(!!success || !!error) && (
            <Alert $variant={error ? 'error' : 'success'}>
              {error ? <ErrorIcon /> : <SuccessIcon />}
              <span>{error || success}</span>
            </Alert>
          )}
        </Header>
        <TextField
          label={inputLabels.email}
          value={user?.email || ''}
          name="email"
          disabled={true}
        />
        {updatingPassword && (
          <PasswordField
            value={values.oldPassword}
            name="oldPassword"
            onChange={(value) => handleType('oldPassword', value)}
            label={inputLabels.oldPassword}
          />
        )}
        <PasswordField
          value={password}
          name="password"
          onChange={(value) => handleType('password', value)}
          label={updatingPassword ? inputLabels.newPassword : inputLabels.password}
        />
        <PasswordField
          value={repeatPassword}
          name="repeatPassword"
          onChange={(value) => handleType('repeatPassword', value)}
          label={updatingPassword ? inputLabels.repeatNewPassword : inputLabels.repeatPassword}
        />
        <PasswordCheckListContainer
          setAllValid={setAllValid}
          password={password}
          repeatPassword={repeatPassword}
        />
        <StyledButton
          variant={ButtonVariants.PRIMARY}
          loading={isLoading}
          disabled={disableSubmit}
          type="submit"
        >
          {buttonsTitles.update}
        </StyledButton>
      </PasswordContainer>
    </ContentLayout>
  );
};

export default UserForm;

const PasswordContainer = styled.form`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 16px;
  width: 100%;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px 24px;
  margin-bottom: 8px;

  @media ${device.mobileL} {
    flex-direction: column;
    align-items: stretch;
  }
`;

const Title = styled.h1`
  margin: 0;
  font-size: 3.2rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Alert = styled.div<{ $variant: 'success' | 'error' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  font-size: 1.4rem;
  font-weight: 500;
  border-radius: 4px;
  /* Accent bar sits on the trailing edge, per the design. */
  border-right: 4px solid
    ${({ theme, $variant }) => ($variant === 'error' ? theme.colors.danger : theme.colors.success)};
  color: ${({ theme, $variant }) =>
    $variant === 'error' ? theme.colors.danger : theme.colors.success};
  background-color: ${({ $variant }) => ($variant === 'error' ? '#fdecef' : '#eafbf6')};

  svg {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
  }
`;

const StyledButton = styled(Button)`
  margin-top: 32px;
`;
