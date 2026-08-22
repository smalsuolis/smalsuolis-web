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
import { useEffect, useState } from 'react';
import { ButtonVariants, device, font } from '../styles';
import { handleToastSuccess } from '../utils/functions';
import { toast } from 'react-toastify';

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

  // Surfaced as a toast rather than inline: the message used to appear beside
  // the heading, where a form filled from the bottom pushed it out of view.
  useEffect(() => {
    if (success) handleToastSuccess(success);
  }, [success]);

  useEffect(() => {
    if (error) {
      toast.error(error, {
        position: 'top-center',
        autoClose: 5000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
      });
    }
  }, [error]);

  return (
    <Page>
      <PasswordContainer noValidate onSubmit={handleSubmit}>
        <Header>{heading && <Title>{heading}</Title>}</Header>
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
  label {
    ${font('base')};
    color: ${({ theme }) => theme.colors.text.primary};
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

  div:has(+ div > input:not([type='checkbox'])) {
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
