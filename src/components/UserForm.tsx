import { TextField } from '@aplinkosministerija/design-system';
import {
  buttonsTitles,
  inputLabels,
  inputPlaceholders,
  PasswordForm,
  useGetCurrentRoute,
  User,
} from '../utils';
import PasswordCheckListContainer from './PasswordCheckListContainer';
import styled from 'styled-components';
import { Button, PasswordField } from '@aplinkosministerija/design-system';
import { useFormik } from 'formik';
import { useState } from 'react';
import { ButtonVariants, device, font } from '../styles';

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
    <Page>
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
            placeholder={inputPlaceholders.enterPassword}
            onChange={(value) => handleType('oldPassword', value)}
            label={inputLabels.oldPassword}
          />
        )}
        <PasswordField
          value={password}
          name="password"
          placeholder={inputPlaceholders.enterPassword}
          onChange={(value) => handleType('password', value)}
          label={updatingPassword ? inputLabels.newPassword : inputLabels.password}
        />
        <PasswordField
          value={repeatPassword}
          name="repeatPassword"
          placeholder={inputPlaceholders.enterPassword}
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
    </Page>
  );
};

export default UserForm;

// Own page shell: ContentLayout also renders the route title, which duplicated
// the heading this form already draws.
const Page = styled.div`
  width: 100%;
  max-width: 599px;
  margin: 0 auto;
  padding: 37px 0 80px;

  @media ${device.mobileL} {
    padding: 24px 20px 48px;
  }
`;

const PasswordContainer = styled.form`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 24px;
  width: 100%;

  /* The design-system field draws a 4px #D4D5DE box under a 14px label; the
     design uses a 40px pill with a #BCBCBC hairline and a 16px black label. */
  div:has(> input) {
    height: 40px;
    border-radius: 100px;
    border-color: ${({ theme }) => theme.colors.grey[500]};
  }

  div:has(> input) > input {
    height: 38px;
    padding: 0 12px;
  }

  div:has(+ div > input) {
    ${font('base')};
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px 24px;
  margin-bottom: 37px;

  @media ${device.mobileL} {
    flex-direction: column;
    align-items: stretch;
  }
`;

const Title = styled.h1`
  margin: 0;
  ${font('3xl')};
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

// Black pill, per the design — the DS primary variant renders green.
const StyledButton = styled(Button)`
  align-self: flex-start;
  width: 141px;
  height: 40px;
  padding: 8px 24px;
  border-radius: 54px;
  margin-top: 5px;
  background-color: ${({ theme }) => theme.colors.black};
  border-color: ${({ theme }) => theme.colors.black};
  color: ${({ theme }) => theme.colors.white};

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.grey[700]};
    border-color: ${({ theme }) => theme.colors.grey[700]};
  }
`;
