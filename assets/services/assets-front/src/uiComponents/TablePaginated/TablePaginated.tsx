import React from 'react';
import { Table, TableProps } from '../Table';
import { getConfig } from 'utils/configUtils';
import { useIntl } from 'react-intl';
import { CommonTexts } from 'texts/commun/commonTexts';
import { useSelector, useDispatch } from 'react-redux';
import {
  paginatedTableKeySelector,
  setPaginatedTable,
} from 'features/user/user.store';

interface IProps<T extends Record<string, unknown>> extends TableProps<T> {
  tableSettingsId: string;
}

export function TablePaginated<T extends Record<string, unknown>>(
  props: React.PropsWithChildren<IProps<T>>,
): React.ReactElement {
  const { manualPagination, translations, tableSettingsId, ...rest } = props;
  const intl = useIntl();
  const config = getConfig();
  const dispatch = useDispatch();
  const columnsActaKey = `${tableSettingsId}-columns`;
  const hiddenActaKey = `${tableSettingsId}-hidden`;
  const freezeActaKey = `${tableSettingsId}-freeze`;

  const initialColumnsOrder = useSelector(
    paginatedTableKeySelector(columnsActaKey),
  ) as Array<string>;
  const initialColumnsHidden = useSelector(
    paginatedTableKeySelector(hiddenActaKey),
  ) as Array<string>;
  const freezeColumnsCount = useSelector(
    paginatedTableKeySelector(freezeActaKey),
  ) as number;

  return (
    <Table
      translations={{
        loadingText: intl.formatMessage(CommonTexts.tableLoading),
        emptyTitle: intl.formatMessage(CommonTexts.tableEmptyTitle),
        emptyDescription: intl.formatMessage(CommonTexts.tableEmptyDescription),
        configureTableTitle: intl.formatMessage(
          CommonTexts.configureTableTitle,
        ),
        configureTableDescription: intl.formatMessage(
          CommonTexts.configureTableDescription,
        ),
        resetColumns: intl.formatMessage(CommonTexts.resetColumns),
        freezeColumns: intl.formatMessage(CommonTexts.freezeColumns),
        freezeNoColumns: intl.formatMessage(CommonTexts.columnsPlurals, {
          count: 0,
        }),
        freezeOneColumn: intl.formatMessage(CommonTexts.columnsPlurals, {
          count: 1,
        }),
        freezeTwoColumn: intl.formatMessage(CommonTexts.columnsPlurals, {
          count: 2,
        }),
        freezeTreeColumn: intl.formatMessage(CommonTexts.columnsPlurals, {
          count: 3,
        }),
        cancelConfigureTableChange: intl.formatMessage(CommonTexts.cancel),
        saveConfigureTableChange: intl.formatMessage(CommonTexts.save),
        tableFiltersClear: intl.formatMessage(CommonTexts.tableClearFilters),
        ...translations,
      }}
      color={config.mainColor}
      manualFilters={true}
      autoResetSortBy={false}
      autoResetPage={false}
      autoResetFilters={false}
      initialColumnsHidden={initialColumnsHidden}
      initialColumnsOrder={initialColumnsOrder}
      freezeColumnsCount={freezeColumnsCount}
      PaginationCount={({ visible, total }) => (
        <>
          {intl.formatMessage(CommonTexts.tableShownNumber, { visible, total })}
        </>
      )}
      onColumnsChange={(newColumns, newHidden, freezeCount) => {
        dispatch(
          setPaginatedTable({
            [columnsActaKey]: newColumns,
            [hiddenActaKey]: newHidden,
            [freezeActaKey]: freezeCount,
          }),
        );
      }}
      {...rest}
    />
  );
}
