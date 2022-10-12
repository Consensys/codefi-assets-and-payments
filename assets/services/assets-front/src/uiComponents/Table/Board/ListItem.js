/* eslint react/prop-types: 0 */
import React from 'react';
import styled from 'styled-components';
import boardColors from './BoardColors';

const getBorderColor = (isDragging) =>
  isDragging ? boardColors.item.dragging.border : '#DFE0E5';

const imageSize = 40;

const Container = styled.a`
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #dfe0e5;
  /* border-color: ${({ isDragging }) => getBorderColor(isDragging)}; */
  background-color: ${boardColors.item.background};
  box-shadow: ${({ isDragging }) =>
    isDragging ? `2px 2px 1px lightgray` : 'none'};
  box-sizing: border-box;
  min-height: ${imageSize}px;
  margin: 8px;
  user-select: none;
  text-decoration: none;
  overflow: hidden;

  /* anchor overrides */
  color: ${boardColors.item.color};

  &:hover,
  &:active {
    color: black;
    text-decoration: none;
  }

  &:focus {
    outline: none;
    border-color: ${boardColors.item.dragging.border};
    box-shadow: none;
  }

  /* flexbox */
  display: flex;
`;

const Content = styled.div`
  /* flex child */
  flex-grow: 1;
  /*
    Needed to wrap text in ie11
    https://stackoverflow.com/questions/35111090/why-ie11-doesnt-wrap-the-text-in-flexbox
  */
  flex-basis: 100%;
  /* flex parent */
  display: flex;
  flex-direction: column;
`;

function getStyle(provided, style) {
  if (!style) {
    return provided.draggableProps.style;
  }

  return {
    ...provided.draggableProps.style,
    ...style,
  };
}

// Previously this extended React.Component
// That was a good thing, because using React.PureComponent can hide
// issues with the selectors. However, moving it over does can considerable
// performance improvements when reordering big lists (400ms => 200ms)
// Need to be super sure we are not relying on PureComponent here for
// things we should be doing in the selector as we do not know if consumers
// will be using PureComponent
function ListItem(props) {
  const {
    item,
    isDragging,
    isGroupedOver,
    provided,
    style,
    isClone,
    index,
    ItemComponent,
    getItemHref,
    updateItem,
  } = props;

  return (
    <Container
      href={getItemHref ? getItemHref(item) : null}
      isDragging={isDragging}
      isGroupedOver={isGroupedOver}
      isClone={isClone}
      ref={provided.innerRef}
      style={getStyle(provided, style)}
      data-is-dragging={isDragging}
      data-index={index}
      {...provided.draggableProps}
    >
      <Content>
        <ItemComponent
          item={item}
          updateItem={updateItem}
          dragHandleProps={provided.dragHandleProps}
        />
      </Content>
    </Container>
  );
}

export default React.memo(ListItem);
