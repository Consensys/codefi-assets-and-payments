/* eslint react/prop-types: 0 */
import React from 'react';
import styled from 'styled-components';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import ListItem from './ListItem.js';
import boardColors from './BoardColors';

export const getBorderColor = (isDraggingOver, isDraggingFrom, options) => {
  if (!options) {
    if (isDraggingOver) {
      return boardColors.column.dragIn;
    }
    if (isDraggingFrom) {
      return boardColors.column.dragOut;
    }
    return boardColors.column.background;
  }
  if (isDraggingOver || isDraggingFrom) {
    return options.color;
  }
  return boardColors.column.background;
};

const Wrapper = styled.div`
  border: 2px dashed
    ${(props) =>
      getBorderColor(
        props.isDraggingOver,
        props.isDraggingFrom,
        props.options,
      )};
  display: flex;
  flex-direction: column;
  opacity: ${({ isDropDisabled }) => (isDropDisabled ? 0.5 : 'inherit')};
  padding-bottom: 0;
  background-color: ${boardColors.column.background};
  transition: border-color 0.5s ease, opacity 0.5s ease;
  user-select: none;
  width: 100%;
`;

const scrollContainerHeight = 250;

const DropZone = styled.div`
  /* stop the list collapsing when empty */
  min-height: ${scrollContainerHeight - 8}px;
  /*
    not relying on the items for a margin-bottom
    as it will collapse when the list is empty
  */
  padding-bottom: 8px;
`;

const ScrollContainer = styled.div`
  overflow-x: hidden;
  overflow-y: auto;
  max-height: ${scrollContainerHeight + 8}px;
`;

/* stylelint-disable block-no-empty */
const Container = styled.div``;
/* stylelint-enable */

const InnerItemList = React.memo(function InnerItemList(props) {
  return props.items.map((item, index) => (
    <Draggable
      key={item.id}
      draggableId={item.id}
      index={index}
      isDragDisabled={props.disableItemDrag}
    >
      {(dragProvided, dragSnapshot) => (
        <ListItem
          key={item.id}
          item={item}
          isDragging={dragSnapshot.isDragging}
          isGroupedOver={Boolean(dragSnapshot.combineTargetFor)}
          provided={dragProvided}
          ItemComponent={props.ItemComponent}
          getItemHref={props.getItemHref}
          updateItem={props.updateItem}
        />
      )}
    </Draggable>
  ));
});

function InnerList(props) {
  const {
    items,
    dropProvided,
    ItemComponent,
    getItemHref,
    disableItemDrag,
    updateItem,
  } = props;
  const title = props.title || null;

  return (
    <Container>
      {title}
      <DropZone ref={dropProvided.innerRef}>
        <InnerItemList
          items={items}
          ItemComponent={ItemComponent}
          getItemHref={getItemHref}
          disableItemDrag={disableItemDrag}
          updateItem={updateItem}
        />
        {dropProvided.placeholder}
      </DropZone>
    </Container>
  );
}

export default function ItemList(props) {
  const {
    ignoreContainerClipping,
    internalScroll,
    scrollContainerStyle,
    isCombineEnabled,
    listId = 'LIST',
    listType,
    style,
    items,
    title,
    useClone,
    ItemComponent,
    getItemHref,
    options,
    disableItemDrag,
    updateItem,
  } = props;

  return (
    <Droppable
      droppableId={listId}
      type={listType}
      ignoreContainerClipping={ignoreContainerClipping}
      isCombineEnabled={isCombineEnabled}
      renderClone={
        useClone
          ? (provided, snapshot, descriptor) => (
              <ListItem
                item={items[descriptor.source.index]}
                provided={provided}
                isDragging={snapshot.isDragging}
                isClone
                ItemComponent={ItemComponent}
                getItemHref={getItemHref}
                updateItem={updateItem}
              />
            )
          : null
      }
    >
      {(dropProvided, dropSnapshot) => (
        <Wrapper
          style={style}
          options={options}
          isDraggingOver={dropSnapshot.isDraggingOver}
          isDraggingFrom={Boolean(dropSnapshot.draggingFromThisWith)}
          {...dropProvided.droppableProps}
        >
          {internalScroll ? (
            <ScrollContainer style={scrollContainerStyle}>
              <InnerList
                items={items}
                title={title}
                dropProvided={dropProvided}
                ItemComponent={ItemComponent}
                getItemHref={getItemHref}
                disableItemDrag={disableItemDrag}
                updateItem={updateItem}
              />
            </ScrollContainer>
          ) : (
            <InnerList
              items={items}
              title={title}
              dropProvided={dropProvided}
              ItemComponent={ItemComponent}
              getItemHref={getItemHref}
              disableItemDrag={disableItemDrag}
              updateItem={updateItem}
            />
          )}
        </Wrapper>
      )}
    </Droppable>
  );
}
