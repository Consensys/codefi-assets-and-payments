import React, {
  useState,
  useRef,
  ReactElement,
  useEffect,
  useCallback,
} from 'react';
import styled from 'styled-components';
import { createPortal } from 'react-dom';

export interface TooltipProps {
  children: ReactElement;
  content: string;
}
const StyledTooltip = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
`;
const StyledContent = styled.div<{ show: boolean; isOnTop: boolean }>`
  position: fixed;
  z-index: 1111111;
  padding: 4px 8px;
  width: fit-content;
  margin-right: auto;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  ${({ show }) => (!show ? 'display: none;' : '')}
  background: ${({ theme }) => theme.palette.bodyInverted};
  color: ${({ theme }) => theme.palette.textInverted};
  ::before {
    content: '';
    left: 0;
    right: 0;
    width: 0px;
    border-right: 8px solid #000a28;
    position: absolute;
    border-bottom: 8px solid #000a28;
    ${({ isOnTop }) => `${isOnTop ? 'bottom' : 'top'}: -3px;`}
    margin-left: auto;
    margin-right: auto;
    transform: rotate(45deg);
  }
`;

export function Tooltip({ children, content }: TooltipProps) {
  const [showContent, setShowContent] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isOnTop, setIsOnTop] = useState(true);
  const childRef = useRef<HTMLElement>();
  const contentRef = useRef<HTMLDivElement>(null);
  const child = React.Children.only(children);

  const calculatePosition = useCallback(() => {
    if (childRef.current && contentRef.current) {
      const childTop = childRef.current.getClientRects()[0]?.top || 10;
      const childHeight = childRef.current.getClientRects()[0]?.height || 10;
      const childLeft = childRef.current.getClientRects()[0]?.left || 10;
      const childWidth = childRef.current.getClientRects()[0]?.width || 10;
      const elementHeight =
        contentRef.current.getClientRects()[0]?.height || 10;
      const top = childTop - elementHeight - 10;
      if (top < 0) setIsOnTop(false);
      if (top > 0 && !isOnTop) setIsOnTop(true);
      setPosition({
        top: top < 0 ? childTop + childHeight + 10 : top,
        left:
          childLeft +
          childWidth / 2 -
          (contentRef.current.getClientRects()[0]?.width || 1) / 2,
      });
    }
  }, [isOnTop]);

  useEffect(() => {
    calculatePosition();
  }, [showContent, content, calculatePosition]);

  return (
    <>
      {createPortal(
        <StyledTooltip>
          <StyledContent
            isOnTop={isOnTop}
            show={showContent}
            ref={contentRef}
            style={{ ...position }}
          >
            {content}
          </StyledContent>
        </StyledTooltip>,
        document.body,
      )}
      {React.cloneElement(child, {
        ref: (el: HTMLElement) => (childRef.current = el),
        onMouseEnter: () => setShowContent(true),
        onMouseLeave: () => setShowContent(false),
      })}
    </>
  );
}
