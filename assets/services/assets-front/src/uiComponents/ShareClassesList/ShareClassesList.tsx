import React from 'react';

import './ShareClassesList.scss';

import { formatDate } from 'utils/commonUtils';
import {
  ClassData,
  combineDateAndTime,
} from 'routes/Issuer/AssetIssuance/assetTypes';

interface IProps {
  shareClasses: Array<ClassData>;
}

export const ShareClassesList: React.FC<IProps> = ({
  shareClasses,
}: IProps) => {
  return (
    <table className="_uiComponent_shareClassesList">
      <thead>
        <tr>
          <td>Share Class</td>
          <td>ISIN Code</td>
          <td>Initial subscribtion cut off date</td>
        </tr>
      </thead>

      <tbody>
        {shareClasses.map((shareClass) => {
          return (
            <tr key={shareClass.key}>
              <td>
                {shareClass.name || shareClass.key || <span>Not set</span>}
              </td>
              <td>{shareClass.isin || <span>Not set</span>}</td>
              <td>
                {shareClass.initialSubscription ? (
                  formatDate(
                    new Date(
                      combineDateAndTime(
                        shareClass.initialSubscription.cutoffDate,
                        shareClass.initialSubscription.cutoffHour,
                      ) || '',
                    ),
                  )
                ) : (
                  <span>Not set</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
