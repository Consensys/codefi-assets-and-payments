import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import styled from 'styled-components';

import { superAdminAccountSettings } from 'texts/routes/superAdmin/superAdminAccountSettings';
import PageTitle from 'uiComponents/PageTitle';
import DataTable, { IDataTableData } from 'uiComponents/DataTable/DataTable';
import { getConfig } from 'utils/configUtils';

import Button from 'uiComponents/Button';
import {
  CLIENT_ROUTE_SUPERADMIN_CREATE_USE_CASE,
  CLIENT_ROUTE_SUPERADMIN_UPDATE_USE_CASE,
} from 'routesList';
import { DataCall } from 'utils/dataLayer';
import { API_LIST_USECASES } from 'constants/apiRoutes';

const StyledContainer = styled.div`
  height: calc(100vh - 64px);
  padding: 32px 40px;

  .content-container {
    padding: 32px;

    .use-case-table {
      table {
        thead {
          tr {
            td {
              &:last-of-type {
                width: 50%;
              }
            }
          }
        }
        tbody {
          tr {
            height: 44px;

            td {
              &:last-of-type {
                button {
                  float: right;
                }
              }

              .default {
                text-transform: uppercase;
                font-size: 11;
                font-weight: 600;
                padding: 4px;
                border-radius: 3px;
                color: #1a5afe;
                background-color: #e6f1ff;
                margin-right: 6px;
                margin-left: 124px;
              }

              .manage-use-case-container {
                display: flex;
                align-items: center;
                justify-content: flex-end;
              }
            }
          }
        }
      }
    }
  }
`;

const UseCaseManagement = () => {
  const [usecases, setUsecases] = useState([]);
  const intl = useIntl();
  const config = getConfig();

  useEffect(() => {
    const loadData = async () => {
      try {
        const caseList = await DataCall({
          method: API_LIST_USECASES.method,
          path: API_LIST_USECASES.path(),
        });

        setUsecases(caseList);
      } catch (error) {
        console.log(error);
      }
    };
    loadData();
  }, [config.tenantId]);

  const renderUseCaseName = (name: string, index: number): JSX.Element => {
    return (
      <div>
        {name}
        {/* Below code renders default - default concept doesnt really exist so commented out */}
        {/*{index === 0 && renderDefault()}*/}
      </div>
    );
  };

  // const renderDefault = (): JSX.Element => {
  //   return <span className="default">Default</span>;
  // };

  const renderEdit = (name: string): JSX.Element => {
    return (
      <Button
        label="Edit"
        size="small"
        href={CLIENT_ROUTE_SUPERADMIN_UPDATE_USE_CASE.pathBuilder({
          useCase: name.trim(),
        })}
        tertiary
      />
    );
  };

  const data: IDataTableData = {
    header: [
      {
        content: 'Use Case Name',
      },
      {
        content: '',
      },
    ],
    rows: usecases.map((usecase: any, index: number) => [
      {
        content: renderUseCaseName(usecase.name, index),
      },
      {
        content:
          typeof (usecase.config.editable === 'boolean') &&
          usecase.config.editable === false
            ? ''
            : renderEdit(usecase.name),
      },
    ]),
  };

  return (
    <StyledContainer>
      <PageTitle
        title={intl.formatMessage(
          superAdminAccountSettings.useCaseManagementTitle,
        )}
        tabActions={[
          {
            label: intl.formatMessage(superAdminAccountSettings.createUseCase),
            href: CLIENT_ROUTE_SUPERADMIN_CREATE_USE_CASE,
          },
        ]}
        withBreadcrumbs
      />
      <div className="content-container">
        <DataTable className="use-case-table" data={data} />
      </div>
    </StyledContainer>
  );
};

export default UseCaseManagement;
