import React from 'react';
import { useIntl } from 'react-intl';
import { CommonTexts } from 'texts/commun/commonTexts';
import { PortfolioTexts } from 'texts/routes/investor/PortfolioTexts';
import { Card } from 'uiComponents/Card';
import { formatDate } from 'utils/commonUtils';
import { currencyFormat } from 'utils/currencyFormat';

interface IProps {
  balance: {
    total?: number;
    dateOfFirstInvestment?: number;
    totalNetSubscriptions?: number;
    currency?: string;
  };
}

export const Balance: React.FC<IProps> = ({
  balance: { total, dateOfFirstInvestment, totalNetSubscriptions, currency },
}: IProps) => {
  const intl = useIntl();
  const empty = '—';
  const data = [
    [
      intl.formatMessage(PortfolioTexts.dateOfFirstInvestment),
      dateOfFirstInvestment
        ? formatDate(new Date(dateOfFirstInvestment))
        : empty,
    ],
    [
      intl.formatMessage(PortfolioTexts.totalNetSubscriptions),
      totalNetSubscriptions
        ? currencyFormat(totalNetSubscriptions, currency)
        : empty,
    ],
  ];

  return (
    <Card className="balance">
      <h2>{intl.formatMessage(CommonTexts.totalBalance)}</h2>
      <div className="total">{currencyFormat(total || 0, currency)}</div>

      <ul>
        {data.map((entry) => (
          <li key={entry[0]}>
            <span>{entry[0]}</span>
            <span>{entry[1]}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
};
