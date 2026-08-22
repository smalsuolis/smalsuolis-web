import { ReactNode, useEffect } from 'react';
import styled from 'styled-components';
import { IconName } from '../../utils';
import { device, font } from '../../styles';
import Icon from '../Icons';

// Shared shell for the auth modals (Login / Register / Forgot / success states).
// A centered white card over a dimmed backdrop, matching the Figma "Login
// register" page: title + close top row, then the modal's own content.
const AuthModalShell = ({
  title,
  onClose,
  children,
  wide,
}: {
  title?: string;
  onClose: () => void;
  children: ReactNode;
  // Success/confirmation variants center their content and hide the title row's
  // heading (they show a checkmark instead) — pass no title for those.
  wide?: boolean;
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <Overlay onClick={onClose}>
      <Card $wide={wide} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <Header $hasTitle={!!title}>
          {title && <Title>{title}</Title>}
          <CloseButton onClick={onClose} aria-label="Uždaryti">
            <Icon name={IconName.close} />
          </CloseButton>
        </Header>
        {children}
      </Card>
    </Overlay>
  );
};

export default AuthModalShell;

// The design anchors the card 305px from the top of the page rather than
// centring it; short windows fall back to a plain top inset so it stays whole.
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(11, 11, 11, 0.4);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow-y: auto;
  padding: 305px 24px 24px;

  @media ${device.mobileL} {
    padding: 302px 16px 24px;
  }

  @media (max-height: 800px) {
    padding-top: 24px;
  }
`;

const Card = styled.div<{ $wide?: boolean }>`
  position: relative;
  width: 100%;
  max-width: 499px;
  background: ${({ theme }) => theme.colors.white};
  border-radius: 8px;
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

  div:has(+ div > input:not([type='checkbox'])) {
    ${font('base')};
    color: ${({ theme }) => theme.colors.text.primary};
  }

  /* The consent line beside the register checkbox: 14/21 grey in the design. */
  div:has(> div > input[type='checkbox']) > div:last-child {
    ${font('sm')};
    color: ${({ theme }) => theme.colors.grey[600]};
  }

  /* The design's box is 16px with a 4px radius; the DS ships 18px at 2px. */
  div:has(> input[type='checkbox']) {
    width: 16px;
    height: 16px;
    border-radius: 4px;
  }
`;

const Header = styled.div<{ $hasTitle: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${({ $hasTitle }) => ($hasTitle ? 'space-between' : 'flex-end')};
  gap: 12px;
`;

const Title = styled.h2`
  ${font('2xl')};
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const CloseButton = styled.button`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  background: transparent;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text.primary};

  svg {
    font-size: 2.4rem;
  }
`;
