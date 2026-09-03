import { ReactNode, useEffect } from 'react';
import styled from 'styled-components';
import { IconName } from '../../utils';
import { checkmarkNudge, device, font } from '../../styles';
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
// Sitting that low it read as falling off the fold, so it is lifted 150px.
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(11, 11, 11, 0.4);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow-y: auto;
  padding: 155px 24px 24px;

  @media ${device.mobileL} {
    padding: 152px 16px 24px;
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
  /* 36 at the sides and the foot, 28 over the title: at an even 24 the card
     read as cramped around its fields. The phone keeps its 16px gutters — the
     card is already the width of the screen there. */
  padding: 28px 36px 36px;
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
    transition: border-color 0.15s ease;
  }

  /* The same two states the search fields answer with. Written out rather than
     pulled from the shared mixin because the border belongs to a design-system
     wrapper we can only reach through a selector. */
  div:has(> input:not([type='checkbox'])):hover {
    border-color: ${({ theme }) => theme.colors.grey[550]};
  }
  div:has(> input:not([type='checkbox'])):focus-within {
    border-color: ${({ theme }) => theme.colors.black};
  }

  div:has(> input:not([type='checkbox'])) > input {
    height: 38px;
    padding: 0 12px;
  }

  input::placeholder {
    ${font('base')};
    color: ${({ theme }) => theme.colors.grey[500]};
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

  /* The design's box is a white 16px square with a 4px radius and a #D9D9D9
     ring; the DS ships an 18px grey-filled one at 2px. */
  div:has(> input[type='checkbox']) {
    width: 16px;
    height: 16px;
    border-radius: 4px;
  }
  div:has(> input[type='checkbox']:not(:checked)) {
    background-color: #ffffff;
    box-shadow: inset 0 0 0 1px #d9d9d9;
  }
  /* The DS paints the unchecked state on an inner 14px layer inset 2px from the
     top left — inside a 16px box that lands flush on the right and bottom edges
     and paints over the ring there, leaving the corner open. The box already
     carries the white fill, so the inner layer has nothing left to draw. */
  div:has(> input[type='checkbox']:not(:checked)) > label {
    background-color: transparent;
  }
  /* The tick inside it is drawn for an 18px box; a pixel left re-centres it. */
  ${checkmarkNudge}
  /* The design sets the box against the consent line with 8px between them.
     The DS reserves a 28px column for an 18px box, which leaves the two 20
     apart and the box adrift from the text it belongs to. */
  div:has(> div > input[type='checkbox']) {
    grid-template-columns: 16px 1fr;
    gap: 8px;
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

const Header = styled.div<{ $hasTitle: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${({ $hasTitle }) => ($hasTitle ? 'space-between' : 'flex-end')};
  gap: 16px;
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
