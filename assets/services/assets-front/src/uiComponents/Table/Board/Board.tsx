import React, { Component } from 'react';
import styled from 'styled-components';
import Column from './Column';
import reorder, { reorderItemMap } from './Reorder';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import boardColors from './BoardColors';
import { IColumnData, IColumnOptions } from './Board.types';
import Loader from '../Loader/Loader';

const ParentContainer = styled.div`
  width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
`;

const Container = styled.div`
  background-color: ${boardColors.background};
  min-height: 100%;
  min-width: 100%;
  display: ${(props: any) => (props.fullScreen ? 'block' : 'inline-flex')};
`;

/**
 * Board component
 * @param {Object} initial - initial set of data, each element in object represents one column array, object name is used for title
 * @param {Object} data - same as initial, but for parent controlling the data
 * @param {Object} options - settings, same object names as in initial
 * @function columnsOrderChanged - Called when columns are rearranged
 * @function itemsOrderChanged - Called when item is moved
 * @param withScrollableColumns - enable scrolling in columns
 * @function ItemComponent - Component that will be used for rendering items
 * @function ColumnHeader - Component that will be used for rendering column header
 * @function getItemHref - function that generates link for item
 * @param isCombineEnabled - Enable combining items
 * @param useClone - Use clone when dragging
 * @param containerHeight - Board height
 * @param disableColumnDrag - Disable columns reordering
 * @param disableItemDrag - Disables items reordering
 * @param isLoading - Indicate that board is waiting for data
 * @param fullScreen - indicate that board will be used in fullscreen
 * @param fullWidth - indicate that board will will parent in width
 * @param color - primary color to be used for buttons
 */

export type BoardProps = {
  initial?: IColumnData;
  data?: IColumnData;
  options: IColumnOptions;
  columnsOrderChanged?: (newOrder?: any) => void;
  itemsOrderChanged?: (newOrder?: any) => void;
  withScrollableColumns?: boolean;
  ItemComponent?: (itemData: any) => React.ReactNode;
  ColumnHeader?: (itemData: any) => React.ReactNode;
  getItemHref?: (itemData: any) => string;
  isCombineEnabled?: boolean;
  useClone?: boolean;
  containerHeight?: string;
  disableColumnDrag?: boolean;
  disableItemDrag?: boolean;
  isLoading?: boolean;
  fullScreen?: boolean;
  fullWidth?: boolean;
  color?: string;
};

export type BoardState = {
  columns: IColumnData;
  ordered: Array<string>;
};

export default class Board extends Component<BoardProps, BoardState> {
  static defaultProps = {
    isCombineEnabled: false,
  };

  state = {
    columns: this.props.initial || this.props.data || {},
    ordered: Object.keys(this.props.initial || this.props.data || {}),
  };

  boardRef: any;

  static getDerivedStateFromProps(
    props: BoardProps,
    state: BoardState,
  ): BoardState | null {
    if (props.data && props.data !== state.columns) {
      return {
        columns: props.data,
        ordered: Object.keys(props.data),
      };
    }
    if (
      props.initial &&
      props.initial === {} &&
      props.initial !== state.columns
    ) {
      return {
        columns: props.initial,
        ordered: Object.keys(props.initial),
      };
    }
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  onDragEnd = (result: any): void => {
    if (result.combine) {
      if (result.type === 'COLUMN') {
        const shallow = [...this.state.ordered];
        shallow.splice(result.source.index, 1);
        this.setState({ ordered: shallow });
        return;
      }

      const column = this.state.columns[result.source.droppableId];
      const withItemRemoved = [...column];
      withItemRemoved.splice(result.source.index, 1);
      const columns = {
        ...this.state.columns,
        [result.source.droppableId]: withItemRemoved,
      };
      this.setState({ columns });
      return;
    }

    // dropped nowhere
    if (!result.destination) {
      return;
    }

    const source = result.source;
    const destination = result.destination;

    // did not move anywhere - can bail early
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // reordering column
    if (result.type === 'COLUMN') {
      const ordered = reorder(
        this.state.ordered,
        source.index,
        destination.index,
      );

      this.setState({
        ordered,
      });

      this.props.columnsOrderChanged && this.props.columnsOrderChanged(ordered);

      return;
    }

    const data = reorderItemMap({
      itemMap: this.state.columns,
      source,
      destination,
    });

    this.setState({
      columns: data.itemMap,
    });
    this.props.itemsOrderChanged && this.props.itemsOrderChanged(data.itemMap);
  };

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  updateItem =
    (key: string) =>
    (item: any): void => {
      const updateIndex = this.state.columns[key].findIndex(
        (el) => el.id === item.id,
      );
      if (updateIndex < 0) {
        return;
      }
      const newValues = { ...this.state.columns };
      newValues[key][updateIndex] = item;
      this.setState({
        columns: newValues,
      });
      this.props.itemsOrderChanged && this.props.itemsOrderChanged(newValues);
    };

  render() {
    const columns = this.state.columns;
    const ordered = this.state.ordered;
    const {
      containerHeight,
      useClone,
      isCombineEnabled,
      withScrollableColumns,
      ItemComponent,
      ColumnHeader,
      getItemHref,
      disableColumnDrag,
      options,
      disableItemDrag,
      isLoading,
      fullWidth,
      fullScreen,
      color,
    } = this.props;
    const widthPercents = fullScreen
      ? 98
      : fullWidth
      ? Math.floor(100 / ordered.length)
      : 0;
    const board = (
      <Droppable
        droppableId="board"
        type="COLUMN"
        direction={fullScreen ? 'vertical' : 'horizontal'}
        ignoreContainerClipping={Boolean(containerHeight)}
        isCombineEnabled={isCombineEnabled}
      >
        {(provided: any) => (
          <Container
            ref={provided.innerRef}
            fullScreen={fullScreen}
            {...provided.droppableProps}
          >
            {ordered.map((key, index) => (
              <Column
                key={key}
                index={index}
                title={key}
                items={columns[key]}
                options={options[key]}
                isScrollable={withScrollableColumns}
                isCombineEnabled={isCombineEnabled}
                useClone={useClone}
                ItemComponent={ItemComponent}
                ColumnHeader={ColumnHeader}
                getItemHref={getItemHref}
                disableColumnDrag={disableColumnDrag}
                disableItemDrag={disableItemDrag}
                widthPercents={widthPercents}
                updateItem={this.updateItem(key)}
              />
            ))}
            {provided.placeholder}
          </Container>
        )}
      </Droppable>
    );

    return (
      <div style={{ position: 'relative', overflow: 'auto', width: '100%' }}>
        {isLoading && <Loader color={color || '#1a5afe'} />}
        <DragDropContext onDragEnd={this.onDragEnd}>
          {containerHeight ? (
            <ParentContainer style={{ height: containerHeight }}>
              {board}
            </ParentContainer>
          ) : (
            board
          )}
        </DragDropContext>
      </div>
    );
  }
}
