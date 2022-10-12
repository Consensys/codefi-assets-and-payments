import React, { ReactElement, PropsWithChildren } from 'react';
import Loader from '../Loader/Loader';
import { Checkbox } from '../Checkbox/Checkbox';
import { Arrow } from '../Icons/Arrow';
import './Dropdown.css';

export interface DropdownItem {
  value: number | string;
}
export interface DropdownProps<T> {
  /** Will show loader */
  isLoading?: boolean;
  /** Dropdown items */
  items: Array<T>;
  /** Render item display name function */
  renderItemName: (item: T) => ReactElement;
  /** On select change callback */
  onSelectChange?: (items: Array<T>) => void;
  /** Is multi-select? */
  isMultiSelect?: boolean;
  /** isOutlined */
  isOutlined?: boolean;
  /** Name of the dropdown */
  name: string;
  /** Highlight dropbox when items are selected */
  highlightTitle?: boolean;
  /** Is dropdown disabled */
  disabled?: boolean;
  /** Default selected */
  defaultValue?: Array<string | number>;
  /** Values selected for manual control of selected items */
  value?: Array<string | number>;
  /** Style */
  style?: React.CSSProperties;
  /* Class name */
  className?: string;
  /** Main color */
  color?: string;
  /** Position of the popup */
  position?: 'top' | 'bottom';
}

export function Dropdown<T extends DropdownItem>(
  props: PropsWithChildren<DropdownProps<T>>,
): ReactElement {
  const {
    items,
    isMultiSelect,
    renderItemName,
    isOutlined,
    isLoading,
    highlightTitle,
    name,
    onSelectChange,
    disabled,
    defaultValue,
    style,
    className,
    value,
    color,
    position,
  } = props;
  const popUpStyle: Record<string, string> = {};
  switch (position) {
    case 'top':
      popUpStyle.bottom = '100%';
      break;
    case 'bottom':
      popUpStyle.top = '100%';
      break;
  }
  const mapValueToItem = (key: string | number): T | undefined =>
    items.find((item) => item.value === key);
  const mapValuesToItems = (keys: Array<string | number>): Array<T> => {
    const result: Array<T> = [];
    keys.forEach((key) => {
      const el = mapValueToItem(key);
      if (el) {
        result.push(el);
      }
    });
    return result;
  };
  const removeUnknownItems = (
    keys?: Array<string | number>,
  ): Array<string | number> | null => {
    const result: Array<string | number> = [];
    if (!keys) {
      return null;
    }
    keys.forEach((key) => {
      const el = mapValueToItem(key);
      if (el) {
        result.push(key);
      }
    });
    return result;
  };
  const [selected, setSelected] = React.useState<Array<number | string>>(
    removeUnknownItems(value) || removeUnknownItems(defaultValue) || [],
  );
  React.useEffect(() => {
    if (value) {
      setSelected(value || []);
    }
    // eslint-disable-next-line
  }, []);
  const [isOpened, setIsOpened] = React.useState(false);

  const selectItem = (key: number | string) => {
    if (isMultiSelect) {
      if (selected.includes(key)) {
        return changeSelectedAndNotify(selected.filter((el) => el !== key));
      }
      return changeSelectedAndNotify([...selected, key]);
    } else {
      setIsOpened(false);
      return changeSelectedAndNotify([key]);
    }
  };
  const changeSelectedAndNotify = (keys: Array<number | string>) => {
    setSelected(keys);
    onSelectChange && onSelectChange(mapValuesToItems(keys));
  };

  const renderDropdownName = () => {
    if (selected.length === 0) {
      return name;
    }
    const item = mapValueToItem(selected[0]);
    const firstItemName = item ? renderItemName(item) : '';
    if (!isMultiSelect) {
      return firstItemName;
    }
    if (firstItemName !== '') {
      return (
        <>
          {name}: {firstItemName}{' '}
          {selected.length > 1 ? ` + ${selected.length - 1}` : ''}
        </>
      );
    }
    return (
      <>
        {name}: {selected.length}
      </>
    );
  };
  const shouldHighlight = highlightTitle && selected.length > 0;
  return (
    <>
      <div className={`dd-wrapper ${className}`} style={style}>
        <div
          className={`dd-header ${isOutlined ? 'outlined' : 'regular'} ${
            shouldHighlight ? 'highlighted' : ''
          } ${isLoading || disabled ? 'disabled' : ''}`}
          onClick={() => !isLoading && setIsOpened(!isOpened)}
        >
          <div className="dd-header-title">{renderDropdownName()}</div>
          {isLoading ? (
            <Loader
              width={12}
              color={shouldHighlight ? 'white' : undefined}
              style={{ marginLeft: '12px' }}
            />
          ) : (
            <Arrow
              orientation={isOpened ? 'Up' : 'Down'}
              color={shouldHighlight ? 'white' : undefined}
            />
          )}
        </div>
        {isOpened && !isLoading && (
          <div role="list" className="dd-list" style={popUpStyle}>
            {items.map((item) => {
              const itemSelected = selected.includes(item.value);
              return (
                <div
                  className={`dd-list-item ${itemSelected ? 'selected' : ''}`}
                  key={item.value}
                  onClick={() => selectItem(item.value)}
                >
                  {isMultiSelect && (
                    <Checkbox color={color} checked={itemSelected} />
                  )}
                  {renderItemName(item)}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {isOpened && !isLoading && (
        <div
          className="dd-closing-overlay"
          onClick={() => setIsOpened(false)}
        ></div>
      )}
    </>
  );
}
