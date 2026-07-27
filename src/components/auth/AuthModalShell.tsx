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

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;

  @media ${device.mobileL} {
    padding: 16px;
  }
`;

const Card = styled.div<{ $wide?: boolean }>`
  position: relative;
  width: 100%;
  max-width: ${({ $wide }) => ($wide ? '480px' : '480px')};
  max-height: 92vh;
  overflow-y: auto;
  background: ${({ theme }) => theme.colors.white};
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Header = styled.div<{ $hasTitle: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${({ $hasTitle }) => ($hasTitle ? 'space-between' : 'flex-end')};
  gap: 12px;
`;

const Title = styled.h2`
  ${font('2xl', 600)};
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const CloseButton = styled.button`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text.primary};

  svg {
    font-size: 2rem;
  }
`;
