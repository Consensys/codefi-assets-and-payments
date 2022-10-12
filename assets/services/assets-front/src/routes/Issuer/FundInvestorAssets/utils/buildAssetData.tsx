import React from 'react';
import { ValueVariationIndicator } from 'uiComponents/ValueVariationIndicator';
import { default as data } from '../mockupData.json';
import { currencyFormat } from 'utils/currencyFormat';
import { formatDate } from 'utils/commonUtils';
import {
  CLIENT_ROUTE_INVESTOR_ADDRESS,
  CLIENT_ROUTE_INVESTOR_ASSETS,
  CLIENT_ROUTE_INVESTOR_PROFILE,
} from 'routesList';
import { UserType } from 'User';
import rules, { Permissions } from 'common/permissions/rules';
import { hasPermissions } from 'common/permissions/Can';

export const buildTabs = ({
  active,
  role,
  investorId,
}: {
  active: string;
  investorId: string;
  role: UserType;
}) => {
  let routes = [
    {
      id: 'details',
      label: 'Details',
      href: CLIENT_ROUTE_INVESTOR_PROFILE.pathBuilder({
        investorId,
      }),
    },
  ];
  if (hasPermissions(rules[role], Permissions.ASSETS_LIST)) {
    routes = [
      ...routes,
      {
        id: 'assets',
        label: 'Assets',
        href: CLIENT_ROUTE_INVESTOR_ASSETS.pathBuilder({
          investorId,
        }),
      },
    ];
  }
  routes = [
    ...routes,
    {
      id: 'address',
      label: 'Ethereum address',
      href: CLIENT_ROUTE_INVESTOR_ADDRESS.pathBuilder({
        investorId,
      }),
    },
  ];
  return routes.map(({ id, href, ...tab }) => ({
    ...tab,
    href: id === active ? '#' : href,
    isActive: id === active,
  }));
};

export const buildAssetData = (
  selectedAssetId: string,
): {
  balance: string;
  performanceYTD: React.ReactNode;
  firstInvestmentDate: string;
  totalNetSubScriptions: string;
  totalNetRedemptions: string;
  earnings: string;
} => {
  const asset = data.assets.find((asset) => asset.id === selectedAssetId);

  /**
   * Balance
   */
  let totalBalance: number;
  if (asset) {
    totalBalance = asset.balance;
  } else {
    totalBalance = data.assets.reduce((memo, asset) => memo + asset.balance, 0);
  }
  const balance = currencyFormat(totalBalance);

  /**
   * Performance
   */
  let performanceYTD = (
    <ValueVariationIndicator variation="neutral" variationLabel="0%" />
  );
  const performance = asset ? asset.performanceYTD : data.performanceYTD;
  if (performance > 0) {
    performanceYTD = (
      <ValueVariationIndicator
        variation="up"
        variationLabel={`${performance}%`}
      />
    );
  } else if (performance < 0) {
    performanceYTD = (
      <ValueVariationIndicator
        variation="down"
        variationLabel={`${performance}%`}
      />
    );
  }

  /**
   * First date
   */
  let firstDate: number;
  if (asset) {
    firstDate = asset.firstInvestmentDate;
  } else {
    firstDate = data.assets.reduce(
      (memo, asset) =>
        asset.firstInvestmentDate < memo ? asset.firstInvestmentDate : memo,
      Infinity,
    );
  }
  const firstInvestmentDate = formatDate(new Date(firstDate));

  /**
   * totalNetSubScriptions
   */
  let totalSubs: number;
  if (asset) {
    totalSubs = asset.totalNetSubScriptions;
  } else {
    totalSubs = data.assets.reduce(
      (memo, asset) => memo + asset.totalNetSubScriptions,
      0,
    );
  }
  const totalNetSubScriptions = currencyFormat(totalSubs);

  /**
   * totalNetRedemptions
   */
  let totalRed: number;
  if (asset) {
    totalRed = asset.totalNetRedemptions;
  } else {
    totalRed = data.assets.reduce(
      (memo, asset) => memo + asset.totalNetRedemptions,
      0,
    );
  }
  const totalNetRedemptions = currencyFormat(totalRed);

  /**
   * Earnings
   */
  let earn: number;
  if (asset) {
    earn = asset.earning;
  } else {
    earn = data.assets.reduce((memo, asset) => memo + asset.earning, 0);
  }
  const earnings = currencyFormat(earn);

  return {
    balance,
    performanceYTD,
    firstInvestmentDate,
    totalNetSubScriptions,
    totalNetRedemptions,
    earnings,
  };
};
