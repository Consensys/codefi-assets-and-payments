const reorder = (
  list: Iterable<unknown>,
  startIndex: number,
  endIndex: number,
): any => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

export interface reorderIndex {
  droppableId: string | number;
  index: number;
}

export interface reorderItemMapProps {
  source: reorderIndex;
  destination: reorderIndex;
  itemMap: any;
}

export default reorder;

export const reorderItemMap = ({
  itemMap,
  source,
  destination,
}: reorderItemMapProps): any => {
  const current = [...itemMap[source.droppableId]];
  const next = [...itemMap[destination.droppableId]];
  const target = current[source.index];

  // moving to same list
  if (source.droppableId === destination.droppableId) {
    const reordered = reorder(current, source.index, destination.index);
    const result = {
      ...itemMap,
      [source.droppableId]: reordered,
    };
    return {
      itemMap: result,
    };
  }

  // moving to different list
  // remove from original
  current.splice(source.index, 1);
  // insert into next
  next.splice(destination.index, 0, target);

  const result = {
    ...itemMap,
    [source.droppableId]: current,
    [destination.droppableId]: next,
  };

  return {
    itemMap: result,
  };
};
