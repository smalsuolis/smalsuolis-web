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
import { handleToastError, handleToastSuccess } from '../utils/functions';

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
    if (error) handleToastError(error);
  }, [error]);

  return (
    <Page>
      <Header>{heading && <Title>{heading}</Title>}</Header>
      <PasswordContainer noValidate onSubmit={handleSubmit}>
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
        <CheckList>
          <PasswordCheckListContainer
            setAllValid={setAllValid}
            password={password}
            repeatPassword={repeatPassword}
          />
        </CheckList>
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

  @media ${device.mobileL} {
    padding: 0 16px;
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

  div:has(+ div > input:not([type='checkbox'])) {
    ${font('base')};
    color: ${({ theme }) => theme.colors.text.primary};
  }

  /* The design paints a field's message and its hairline red when it fails. */
  div:has(> input:not([type='checkbox'])) + label {
    ${font('base')};
    color: ${({ theme }) => theme.colors.text.error};
  }
  div:has(> input:not([type='checkbox'])):has(+ label) {
    border-color: ${({ theme }) => theme.colors.text.error};
  }
`;

// The design leaves 29px above the check list and the button, against the 24
// between the fields themselves.
const CheckList = styled.div`
  margin-top: 5px;
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
    color: ${({ theme }) => theme.colors.white};
  }

  /* Disabled, it answers the pointer with nothing: the DS hover has no guard of
     its own and would paint the variant's green over this black pill. */
  &:hover:disabled {
    background-color: ${({ theme }) => theme.colors.black};
    border-color: ${({ theme }) => theme.colors.black};
    color: ${({ theme }) => theme.colors.white};
  }
`;
