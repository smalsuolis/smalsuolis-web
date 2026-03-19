import React, { useState } from 'react';
import styled from 'styled-components';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
}

const TooltipWrapper = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

const TooltipContent = styled.div<{ $visible: boolean }>`
  visibility: ${({ $visible }) => ($visible ? 'visible' : 'hidden')};
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  background-color: #333;
  color: #fff;
  text-align: left;
  border-radius: 4px;
  padding: 8px 12px;
  position: absolute;
  z-index: 1000;
  bottom: 125%;
  right: 0;
  transition:
    opacity 0.2s,
    visibility 0.2s;
  font-size: 1.2rem;
  font-weight: 400;
  width: max-content;
  max-width: 250px;
  white-space: normal;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  pointer-events: ${({ $visible }) => ($visible ? 'auto' : 'none')};

  /* Right align anchor on desktop as well to prevent clipping */
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    right: 10px;
    border-width: 5px;
    border-style: solid;
    border-color: #333 transparent transparent transparent;
  }
`;

const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [visible, setVisible] = useState(false);

  return (
    <TooltipWrapper
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onClick={() => setVisible(!visible)}
    >
      {children}
      <TooltipContent
        $visible={visible}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
      >
        {content}
      </TooltipContent>
    </TooltipWrapper>
  );
};

export default Tooltip;
