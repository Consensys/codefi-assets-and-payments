/* eslint react/prop-types: 0 */
/* eslint-disable no-use-before-define */
import React from 'react';
import styled from 'styled-components';
import { Draggable } from 'react-beautiful-dnd';

import ItemList from './ItemList';
import boardColors from './BoardColors';

const Container = styled.div`
  margin: 8px;
  display: flex;
  flex-direction: column;
  border: 1px solid
    ${({ noBorder }) =>
      noBorder ? 'transparent' : boardColors.column.border.color};
  min-width: 250px;
  width: ${({ widthPercents, width }) =>
    widthPercents ? `${widthPercents}%` : width || '250px'};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  background-color: ${boardColors.header.background};
  justify-content: center;
  transition: background-color 0.2s ease;
`;

export default class Column extends React.Component {
  render() {
    const {
      title,
      items,
      index,
      options,
      widthPercents,
      ColumnHeader,
      updateItem,
      disableColumnDrag,
      disableItemDrag,
      isScrollable,
      isCombineEnabled,
      useClone,
      ItemComponent,
      getItemHref,
    } = this.props;

    return (
      <Draggable
        draggableId={title}
        index={index}
        isDragDisabled={disableColumnDrag}
      >
        {(provided, snapshot) => (
          <Container
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...options}
            widthPercents={widthPercents}
          >
            <Header isDragging={snapshot.isDragging} options={options}>
              <ColumnHeader
                isDragging={snapshot.isDragging}
                {...provided.dragHandleProps}
                options={options}
              />
            </Header>
            <ItemList
              listId={title}
              listType="ITEM"
              style={{
                border: '2px dashed',
                borderColor: snapshot.isDragging ? options.color : null,
              }}
              items={items}
              options={options}
              internalScroll={isScrollable}
              isCombineEnabled={Boolean(isCombineEnabled)}
              useClone={Boolean(useClone)}
              ItemComponent={ItemComponent}
              getItemHref={getItemHref}
              disableItemDrag={disableItemDrag}
              updateItem={updateItem}
            />
          </Container>
        )}
      </Draggable>
    );
  }
}
