import React from 'react';
import CSS from 'csstype';

import { Link } from 'react-router-dom';
import Icon from 'uiComponents/Icon';
import { mdiChevronLeft, mdiChevronRight, mdiDotsHorizontal } from '@mdi/js';
import { colors } from 'constants/styles';

import StyledPagination from './StyledPagination';

interface IProps {
  readonly className?: string;
  readonly id?: string;
  readonly style?: CSS.Properties;
  readonly currentPage: number;
  readonly actions: Array<string | number | (() => void)>;
}

interface ILink {
  action?: string | number | (() => void);
  content: React.ReactNode;
  class?: string;
  index?: number;
}

const Pagination: React.FC<IProps> = ({
  actions,
  className,
  currentPage,
  id,
  style,
}) => {
  if (!actions || actions.length < 2) {
    return <React.Fragment />;
  }

  let startPage = currentPage - 3;
  if (startPage > actions.length - 5) {
    startPage = actions.length - 5;
  }
  startPage = Math.max(1, startPage);

  const displayedActions: Array<ILink | null> = [
    // If we are not on the first page, display a back button
    {
      action: currentPage > 0 ? actions[currentPage - 1] : undefined,
      content: <Icon icon={mdiChevronLeft} width={20} color="#666" />,
      class: 'chevron',
    },

    // The first link is always here
    {
      action: actions[0],
      content: 1,
      index: 0,
    },

    // If the current page is over 4, we skip the links between 1 and 4
    // and display dots to indicate the skip
    currentPage > 3
      ? {
          content: <Icon icon={mdiDotsHorizontal} width={20} color="#666" />,
          class: 'dots',
        }
      : null,

    // We display the elements between the start page and the start page + 5
    ...actions
      .slice(startPage, Math.min(startPage + 5, actions.length - 1))
      .map((action, index) => ({
        action: action,
        content: index + startPage + 1,
        index: index + startPage,
      })),

    // If the current page is further than four links to the end, skip
    // links until the end and display dots to indicate the split
    currentPage + 5 < actions.length - 1
      ? {
          content: <Icon icon={mdiDotsHorizontal} width={20} color="#666" />,
          class: 'dots',
        }
      : null,

    // Always display the last link
    {
      action: actions[actions.length - 1],
      content: actions.length,
      index: actions.length - 1,
    },

    // If we are not currently at the last page, display a next button

    {
      action:
        currentPage < actions.length - 1 ? actions[currentPage + 1] : undefined,
      content: <Icon icon={mdiChevronRight} width={20} color="#666" />,
      class: 'chevron',
    },
  ].filter((link) => Boolean(link));

  return (
    <StyledPagination className={`${className || ''}`} id={id} style={style}>
      {displayedActions.map((action, index) => {
        if (!action) {
          return <React.Fragment />;
        }

        if (
          action.action === undefined ||
          action.action === null ||
          action.class === 'dots'
        ) {
          return (
            <div key={index} className="dots">
              {action.content}
            </div>
          );
        }

        if (
          typeof action.action === 'string' ||
          typeof action.action === 'number'
        ) {
          return (
            <Link
              className={`${action.class || ''} ${
                currentPage === action.index ? 'active' : ''
              }`}
              key={index}
              to={String(action.action)}
              style={{
                color: colors.main,
              }}
            >
              {action.content}
            </Link>
          );
        }

        return (
          <button
            onClick={currentPage === action.index ? undefined : action.action}
            className={`${action.class || ''} ${
              currentPage === action.index ? 'active' : ''
            }`}
            key={index}
          >
            {action.content}
          </button>
        );
      })}
    </StyledPagination>
  );
};

export default Pagination;
