import { User } from './user';
import { Action, ActionExample } from './workflow/workflowInstances/action';
import { Link, LinkExample } from './workflow/workflowInstances/link';
import {
  ERC20Balances,
  ERC721Balances,
  ERC1400Balances,
  ERC1400BalancesExample,
} from './balance';
import { Order, OrderExample } from './workflow/workflowInstances/order';

export enum keys {
  LINKS = 'links',
  VEHICLES = 'vehicles',
  TOKEN_ACTIONS = 'tokenActions', // FIXME - rename tokenActions to actions when front-end will be ready
  TOKEN_ORDERS = 'tokenOrders', // FIXME - rename tokenOrders to orders when front-end will be ready
  BALANCES = 'balances',
  ONCHAIN_ALLOWLIST = 'onChainAllowlist',
  ONCHAIN_BLOCKLIST = 'onChainBlocklist',
}

export interface UserTokenData {
  [keys.LINKS]?: Array<Link>;
  [keys.VEHICLES]?: Array<User>;
  [keys.TOKEN_ACTIONS]?: Array<Action>;
  [keys.TOKEN_ORDERS]?: Array<Order>;
  [keys.BALANCES]?: ERC20Balances | ERC721Balances | ERC1400Balances;
  [keys.ONCHAIN_ALLOWLIST]?: boolean;
  [keys.ONCHAIN_BLOCKLIST]?: boolean;
}

export interface UserProjectData {
  [keys.LINKS]?: Array<Link>;
  [keys.VEHICLES]?: Array<User>;
}

export const UserTokenDataExample: UserTokenData = {
  [keys.LINKS]: [LinkExample],
  [keys.TOKEN_ACTIONS]: [ActionExample],
  [keys.TOKEN_ORDERS]: [OrderExample],
  [keys.BALANCES]: ERC1400BalancesExample,
};

export const UserProjectDataExample: UserProjectData = {
  [keys.LINKS]: [LinkExample],
};
