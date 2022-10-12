import { Injectable } from '@nestjs/common';

import web3Utils from 'web3-utils';

import ErrorService from 'src/utils/errorService';

import { keys as WalletKeys, Wallet, WalletType } from 'src/types/wallet';
import { keys as UserKeys, User, UserType } from 'src/types/user';
import {
  ListAllWalletsOutput,
  CreateWalletOutput,
  UpdateWalletOutput,
} from '../wallet.dto';
import { checkValidEnumValue } from 'src/utils/enumUtils';
import { keys as LinkKeys } from 'src/types/workflow/workflowInstances';
import { Link } from 'src/types/workflow/workflowInstances/link';
import { ApiEntityCallService } from '../../v2ApiCall/api.call.service/entity';
import { walletTypeMap } from './walletTypeMap';
import {
  WalletCreateRequest,
  WalletType as EntityApiWalletType,
} from '@codefi-assets-and-payments/ts-types';

@Injectable()
export class WalletService {
  constructor(private readonly apiEntityCallService: ApiEntityCallService) {}

  /**
   * [List all wallets]
   * Returns the list of user's wallets.
   */
  async listAllWallets(
    tenantId: string,
    userId: string,
  ): Promise<ListAllWalletsOutput> {
    try {
      const user: User = await this.apiEntityCallService.fetchEntity(
        tenantId,
        userId,
        true,
      );

      this.checkWalletAddressIsValidAndRetrieveWalletIndex(
        user[UserKeys.WALLETS],
        user[UserKeys.DEFAULT_WALLET],
      );

      return {
        defaultWallet: user[UserKeys.DEFAULT_WALLET],
        wallets: user[UserKeys.WALLETS],
        message: `${
          user[UserKeys.WALLETS].length
        } wallet(s) listed successfully for user: ${user[UserKeys.USER_ID]}`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing wallets',
        'listAllWallets',
        false,
        500,
      );
    }
  }

  /**
   * [Create wallet]
   * Returns the created wallet.
   */
  async createWallet(
    tenantId: string,
    userId: string,
    walletAddress: string,
    walletType: WalletType, // TODO: test what happens when an invalid wallet type is requested
    walletData: any,
    setAsDefaultWallet: boolean,
  ): Promise<CreateWalletOutput> {
    try {
      const user: User = await this.apiEntityCallService.fetchEntity(
        tenantId,
        userId,
        true,
      );
      const wallets = user[UserKeys.WALLETS];

      let newWalletAddress;
      if (walletType === WalletType.VAULT) {
        if (user?.[UserKeys.USER_TYPE] === UserType.VEHICLE) {
          await this.apiEntityCallService.fetchEntity(
            tenantId,
            user[UserKeys.SUPER_USER_ID],
            false,
          ); // Check superUser exists

          const preCreatedWallet: {
            address: string;
            type: EntityApiWalletType;
          } = await this.apiEntityCallService.preCreateWalletForVehicle(
            tenantId,
            user[UserKeys.SUPER_USER_ID],
          );
          newWalletAddress = preCreatedWallet.address;
        }
      } else {
        newWalletAddress = walletAddress;
      }

      if (newWalletAddress && !web3Utils.isAddress(newWalletAddress)) {
        ErrorService.throwError(
          `${newWalletAddress} is an invalid Ethereum address`,
        );
      }

      let walletFound: boolean;
      if (wallets.length > 0) {
        wallets.map((wallet: Wallet) => {
          if (wallet[WalletKeys.WALLET_ADDRESS] === newWalletAddress) {
            walletFound = true;
          }
        });

        if (walletFound) {
          ErrorService.throwError(
            `wallet with address ${newWalletAddress} already belongs to list of user's wallets`,
          );
        }
      }

      const walletCreateRequest: WalletCreateRequest = {
        type: walletTypeMap[walletType],
        metadata: {
          ...walletData,
        },
      };
      if (newWalletAddress) {
        walletCreateRequest.address =
          web3Utils.toChecksumAddress(newWalletAddress);
      }
      const createdWallet = await this.apiEntityCallService.createWallet(
        tenantId,
        userId,
        walletCreateRequest,
        setAsDefaultWallet,
      );

      return {
        wallet: createdWallet,
        message: `Wallet ${newWalletAddress} ${
          walletAddress === newWalletAddress ? 'registered' : 'created'
        } successfully for user ${user[UserKeys.USER_ID]} ${
          setAsDefaultWallet ? 'and set as default wallet' : ''
        }`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating wallet',
        'createWallet',
        false,
        500,
      );
    }
  }

  /**
   * [Update wallet]
   * Returns the updated wallet.
   */
  async updateWallet(
    tenantId: string,
    userId: string,
    walletAddress: string,
    newWalletData: any,
    setAsDefaultWallet: boolean,
  ): Promise<UpdateWalletOutput> {
    try {
      // TODO BGC Replace with PATCH endpoint when it is ready
      const currentWallet = await this.apiEntityCallService.fetchWallet(
        tenantId,
        userId,
        walletAddress,
      );
      const newWalletMetadata = {
        ...currentWallet?.data,
        ...newWalletData,
      };
      // cleanup data by removing keys with null values
      Object.keys(newWalletMetadata).forEach((key: string) => {
        if (newWalletMetadata[key] === null) {
          delete newWalletMetadata[key];
        }
      });
      const updatedWallet = await this.apiEntityCallService.updateWallet(
        tenantId,
        userId,
        walletAddress,
        {
          metadata: newWalletMetadata,
        },
        setAsDefaultWallet,
      );

      return {
        wallet: updatedWallet,
        message: `Wallet ${walletAddress} updated successfully for user ${userId} ${
          setAsDefaultWallet ? 'and set as default wallet' : ''
        }`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'updating wallet',
        'updateWallet',
        false,
        500,
      );
    }
  }

  /**
   * [Extract wallet addresses list from user-token links]
   */
  extractWalletAddressesListFromUserEntityLinks(
    userEntityLinks: Array<Link>,
  ): Array<string> {
    try {
      const walletAddresses: Array<string> = [];
      userEntityLinks.map((userEntityLink: Link) => {
        if (
          userEntityLink &&
          userEntityLink[LinkKeys.DATA] &&
          userEntityLink[LinkKeys.WALLET] &&
          web3Utils.isAddress(userEntityLink[LinkKeys.WALLET])
        ) {
          if (walletAddresses.indexOf(userEntityLink[LinkKeys.WALLET]) < 0) {
            walletAddresses.push(userEntityLink[LinkKeys.WALLET]);
          }
        } else {
          ErrorService.throwError(
            'invalid user-entity link data --> impossible to retrieve wallet from it',
          );
        }
      });
      return walletAddresses;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'extracting wallet addresses from user-entity links',
        'extractWalletAddressesListFromUserEntityLinks',
        false,
        500,
      );
    }
  }

  /**
   * [Extract wallet from user-token link]
   */
  extractWalletFromUserEntityLinks(
    user: User,
    userTokenLinks: Array<Link>,
    assetClassKey: string,
  ): Wallet {
    try {
      let selectedLink: Link;
      if (userTokenLinks.length > 0) {
        selectedLink = userTokenLinks[0]; // Take first link by default
        for (let index = 0; index < userTokenLinks.length; index++) {
          const link: Link = userTokenLinks[index];
          if (link && link[LinkKeys.ASSET_CLASS] === assetClassKey) {
            selectedLink = link;
            break;
          }
        }
      } else {
        ErrorService.throwError(
          `shall never happen: empty user-token links array for user ${
            user[UserKeys.USER_ID]
          }`,
        );
      }

      if (
        selectedLink &&
        selectedLink[LinkKeys.WALLET] &&
        web3Utils.isAddress(selectedLink[LinkKeys.WALLET])
      ) {
        const wallet: Wallet = this.extractWalletFromUser(
          user,
          selectedLink[LinkKeys.WALLET],
        );

        return wallet;
      } else {
        ErrorService.throwError(
          'invalid user-entity link data --> impossible to retrieve wallet from it',
        );
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'extracting wallet from user-entity link',
        'extractWalletFromUserEntityLinks',
        false,
        500,
      );
    }
  }

  /**
   * [Extract wallet from user-token link]
   */
  extractWalletFromUserEntityLink(user: User, userEntityLink: Link): Wallet {
    try {
      if (
        userEntityLink &&
        userEntityLink[LinkKeys.WALLET] &&
        web3Utils.isAddress(userEntityLink[LinkKeys.WALLET])
      ) {
        const wallet: Wallet = this.extractWalletFromUser(
          user,
          userEntityLink[LinkKeys.WALLET],
        );

        return wallet;
      } else {
        ErrorService.throwError(
          'invalid user-entity link data --> impossible to retrieve wallet from it',
        );
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'extracting wallet from user-entity link',
        'extractWalletFromUserEntityLink',
        false,
        500,
      );
    }
  }

  /**
   * [Extract wallet from user]
   *
   * If a wallet address is specified, the associated wallet is extracted from user object.
   * If no wallet address is specified, the default wallet is extracted from user object.
   */
  extractWalletFromUser(user: User, walletAddress: string): Wallet {
    try {
      if (user && user[UserKeys.DEFAULT_WALLET] && user[UserKeys.WALLETS]) {
        const walletToExtract: string = walletAddress
          ? walletAddress
          : user[UserKeys.DEFAULT_WALLET];
        const walletIndex: number =
          this.checkWalletAddressIsValidAndRetrieveWalletIndex(
            user[UserKeys.WALLETS],
            walletToExtract,
          );

        const rawWallet: Wallet = user[UserKeys.WALLETS][walletIndex];

        if (
          rawWallet[WalletKeys.WALLET_TYPE] && // Deprecated wallet types
          !checkValidEnumValue(WalletType, rawWallet[WalletKeys.WALLET_TYPE])
        ) {
          ErrorService.throwError(
            `invalid wallet type: ${rawWallet[WalletKeys.WALLET_TYPE]}`,
          );
        }

        if (
          rawWallet[WalletKeys.WALLET_NEW_TYPE] && // New wallet types
          !checkValidEnumValue(
            EntityApiWalletType,
            rawWallet[WalletKeys.WALLET_NEW_TYPE],
          )
        ) {
          ErrorService.throwError(
            `invalid wallet type: ${rawWallet[WalletKeys.WALLET_TYPE]}`,
          );
        }

        const wallet: Wallet = {
          ...rawWallet,
          [WalletKeys.WALLET_ADDRESS]: web3Utils.toChecksumAddress(
            rawWallet[WalletKeys.WALLET_ADDRESS],
          ),
        };

        return wallet;
      } else {
        ErrorService.throwError(
          'invalid user: impossible to retrieve wallet from it',
        );
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'extracting wallet from user',
        'extractWalletFromUser',
        false,
        500,
      );
    }
  }

  /**
   * [Check if wallet address is valid and retrieve wallet index]
   * Verifies if wallet is stored in array of user's wallets.
   */
  checkWalletAddressIsValidAndRetrieveWalletIndex(
    wallets: Array<Wallet>,
    walletAddress: string,
  ): number {
    try {
      let walletFound: boolean;
      let retrievedWalletIndex: number;
      if (wallets.length <= 0) {
        ErrorService.throwError('user has no wallets');
      }

      wallets.map((wallet: Wallet, index: number) => {
        if (
          web3Utils.toChecksumAddress(wallet[WalletKeys.WALLET_ADDRESS]) ===
          web3Utils.toChecksumAddress(walletAddress)
        ) {
          walletFound = true;
          retrievedWalletIndex = index;
        }
      });

      if (!walletFound) {
        ErrorService.throwError(
          "requested wallet was not found in list of user's wallets",
        );
      }

      return retrievedWalletIndex;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking wallet address is valid and retrieving wallet index',
        'checkWalletAddressIsValidAndRetrieveWalletIndex',
        false,
        500,
      );
    }
  }
}
