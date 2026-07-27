import { ButtonHTMLAttributes, ReactNode } from 'react';
import styled, { css } from 'styled-components';
import { font } from '../../styles';

type Variant = 'primary' | 'dark' | 'light';
type Size = 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

// New-design button. Pill-shaped, three variants:
//  - primary: green fill (brand)
//  - dark:    black fill, white text (hero "Ieškoti", most CTAs)
//  - light:   white fill, dark text (on dark backgrounds, e.g. subscribe CTA)
const Button = ({ variant = 'dark', size = 'md', children, ...rest }: Props) => (
  <StyledButton $variant={variant} $size={size} {...rest}>
    {children}
  </StyledButton>
);

export default Button;

const variantStyles = {
  primary: css`
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.text.primary};
    &:hover:not(:disabled) {
      filter: brightness(0.96);
    }
  `,
  dark: css`
    background: ${({ theme }) => theme.colors.black};
    color: ${({ theme }) => theme.colors.white};
    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.colors.grey[700]};
    }
  `,
  light: css`
    background: ${({ theme }) => theme.colors.white};
    color: ${({ theme }) => theme.colors.text.primary};
    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.colors.grey[300]};
    }
  `,
};

const StyledButton = styled.button<{ $variant: Variant; $size: Size }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  /* Design-system Button: pill radius 54px, Plus Jakarta Sans Regular 16px,
     56px tall via 8px/24px padding (md). See Figma DS component node 130:688. */
  border-radius: 54px;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background 0.15s ease,
    filter 0.15s ease;
  ${font('base', 400)};
  padding: ${({ $size }) => ($size === 'lg' ? '16px 32px' : '8px 24px')};
  min-height: ${({ $size }) => ($size === 'lg' ? '64px' : '56px')};

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  ${({ $variant }) => variantStyles[$variant]};
`;
