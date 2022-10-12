import styled from 'styled-components';

export const PaginationWrapper = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  flex-wrap: wrap-reverse;
  justify-content: space-between;
  .paginationNumbersWrapper {
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    justify-content: flex-end;
  }
  .rowsNumberSelect {
    display: flex;
    flex-grow: 1;
    justify-content: flex-start;
    align-items: center;
  }
`;

interface PaginationButtonProps {
  color?: string;
  noEvents?: boolean;
}
export const PaginationButton = styled.div`
  pointer-events: ${({ noEvents }: PaginationButtonProps) =>
    noEvents ? 'none' : 'inherit'};
  display: inline-flex;
  min-width: 27px;
  justify-content: center;
  align-items: center;
  padding: 4px 0px;
  background: #ffffff;
  border-radius: 2px;
  flex: none;
  order: 1;
  flex-grow: 0;
  margin: 0px 4px;
  user-select: none;
  cursor: pointer;
  path {
    fill: #475166;
  }
  &:hover {
    color: ${({ color }: PaginationButtonProps) => color};
    fill: ${({ color }: PaginationButtonProps) => color};
    path {
      fill: ${({ color }: PaginationButtonProps) => color};
    }
  }
  &.active {
    background: ${({ color }: PaginationButtonProps) => color};
    color: white;
  }
  &.disabled {
    opacity: 0.6;
    cursor: default;
    pointer-events: none;
  }
`;
