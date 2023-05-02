import { Injectable } from '@nestjs/common';

import ErrorService from 'src/utils/errorService';

import { stateRules, TokenState, TokenRule } from 'src/types/states';
import {
  keys as TokenKeys,
  AssetClassOnChainData,
  Token,
  AssetStateOnChainData,
  TOKEN_STATE_MAX_LENGTH,
  ASSET_CLASS_MAX_LENGTH,
} from 'src/types/token';
import { hexaToASCII, ASCIIToHexa } from 'src/utils/hex';
import { checkSolidityBytes32 } from 'src/utils/solidity';
import {addNumbersByConvertingIntoBigNumber} from "src/utils/number";

@Injectable()
export class PartitionService {
  public allTokenStates: Array<TokenState>;

  constructor() {
    this.allTokenStates = this.listAllTokenStates();
  }

  listAllTokenStates(): Array<TokenState> {
    try {
      return Object.keys(stateRules).map(
        (tokenState: TokenState) => tokenState,
      );
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'lisiting all token states',
        'listAllTokenStates',
        false,
        500,
      );
    }
  }

  listAllPartitionsForToken(token: Token): Array<string> {
    try {
      const assetClasses: Array<string> = token[TokenKeys.ASSET_CLASSES];

      const partitions: Array<string> = [];

      assetClasses.map((assetClass: string) => {
        const allPartitions: Array<string> =
          this.listAllPartitionsForAssetClass(assetClass ? assetClass : '');
        allPartitions.map((partition: string) => {
          partitions.push(partition);
        });
      });

      return partitions;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'lisiting all partitions for a specific token',
        'listAllPartitionsForToken',
        false,
        500,
      );
    }
  }

  listAllPartitionsForAssetClass(assetClass: string): Array<string> {
    try {
      return this.allTokenStates.map((tokenState: TokenState) => {
        return this.createPartition(tokenState, assetClass);
      });
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'lisiting all partitions for a specific asset class',
        'listAllPartitionsForAssetClass',
        false,
        500,
      );
    }
  }

  /**
   *	Create a partition in the right format (bytes32 in solidity)
   *	 - The 12 first bytes (on the left) contain the state of the token (e.g. locked | reserved | issued | collateral)
   *	 - The 20 next bytes (on the right) contain the class of the asset (class to be chosen by the issuer)
   */
  createPartition(tokenState: TokenState, assetClass: string): string {
    try {
      const _assetClass: string = assetClass ? assetClass : '';

      if (tokenState.length > TOKEN_STATE_MAX_LENGTH) {
        ErrorService.throwError(
          `token state shall not exceed ${TOKEN_STATE_MAX_LENGTH} characters`,
        );
      }
      if (_assetClass.length > ASSET_CLASS_MAX_LENGTH) {
        ErrorService.throwError(
          `asset class shall not exceed ${ASSET_CLASS_MAX_LENGTH} characters`,
        );
      }
      const tokenStateHex: string = ASCIIToHexa(
        tokenState.toLowerCase(),
        TOKEN_STATE_MAX_LENGTH,
      );
      const assetClassHex: string = ASCIIToHexa(
        _assetClass.toLowerCase(),
        ASSET_CLASS_MAX_LENGTH,
      );
      return `0x${tokenStateHex}${assetClassHex}`;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating partition',
        'createPartition',
        false,
        500,
      );
    }
  }

  createERC20CompliantPartitionsForEachAssetClass(
    assetClasses: Array<string>,
  ): Array<string> {
    try {
      const erc20CompliantPartitions: Array<string> = [];

      this.allTokenStates.map((tokenState: TokenState) => {
        if (this.checkStateIsERC20Compliant(tokenState)) {
          if (assetClasses && assetClasses.length > 0) {
            assetClasses.map((assetClass: string) => {
              const newPartition: string = this.createPartition(
                tokenState,
                assetClass,
              );
              erc20CompliantPartitions.push(newPartition);
            });
          } else {
            const newPartition: string = this.createPartition(tokenState, '');
            erc20CompliantPartitions.push(newPartition);
          }
        }
      });

      return erc20CompliantPartitions;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating ERC20-compliant partitions for each asset class',
        'createERC20CompliantPartitionsForEachAssetClass',
        false,
        500,
      );
    }
  }

  retrieveAssetClassFromPartition(partition: string): string {
    try {
      checkSolidityBytes32(partition);

      const assetClassHex: string = partition.substring(24, 64);
      return hexaToASCII(assetClassHex).replace(/\0/g, '');
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving asset class from partition',
        'retrieveAssetClassFromPartition',
        false,
        500,
      );
    }
  }

  retrieveTokenStateFromPartition(partition: string): TokenState {
    try {
      checkSolidityBytes32(partition);

      const tokenStateHex: string = partition.substring(0, 24);
      const tokenStateASCII: string = hexaToASCII(tokenStateHex).replace(
        /\0/g,
        '',
      );
      let retrievedTokenState: TokenState;
      Object.keys(stateRules).map((tokenState: TokenState) => {
        if (tokenState === tokenStateASCII) {
          retrievedTokenState = tokenState;
        }
      });

      if (!retrievedTokenState) {
        ErrorService.throwError(
          'no valid token state has been found in the partition',
        );
      }
      return retrievedTokenState;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving token state from partition',
        'retrieveTokenStateFromPartition',
        false,
        500,
      );
    }
  }

  retrieveFormattedClassesAndStatesFromOnChainData(
    defaultPartitions: Array<string>,
    totalPartitions: Array<string>,
    partitionSupplies: Array<number>,
    tokenTotalSupply: number,
  ): Array<AssetClassOnChainData> {
    try {
      const assetClassesOnChainData: Array<AssetClassOnChainData> = [];
      const assetStatesOnChainData: object = {};

      if (totalPartitions.length === 0 && partitionSupplies.length === 0) {
        return [];
      } else if (totalPartitions.length !== partitionSupplies.length) {
        ErrorService.throwError(
          `shall never happen: different lengths for totalPartitions (${totalPartitions.length}) and partitionSupplies ${partitionSupplies.length} arrays`,
        );
      }

      for (let index1 = 0; index1 < totalPartitions.length; index1++) {
        const partition = totalPartitions[index1];
        const partitionSupply = partitionSupplies[index1];

        const partitionClass: string =
          this.retrieveAssetClassFromPartition(partition);
        const partitionState: TokenState =
          this.retrieveTokenStateFromPartition(partition);

        const assetStateOnChainData: AssetStateOnChainData = {
          [TokenKeys.ASSET_CLASSES_ON_CHAIN_STATES_NAME]: partitionState,
          [TokenKeys.ASSET_CLASSES_ON_CHAIN_STATES_TOTAL_SUPPLY]:
            partitionSupply,
          [TokenKeys.ASSET_CLASSES_ON_CHAIN_STATES_ERC20_COMPLIANT]:
            defaultPartitions.indexOf(partition) >= 0,
          [TokenKeys.ASSET_CLASSES_ON_CHAIN_STATES_PARTITION]: partition,
        };

        if (
          assetStatesOnChainData[partitionClass] &&
          assetStatesOnChainData[partitionClass].length > 0
        ) {
          assetStatesOnChainData[partitionClass].push(assetStateOnChainData);
        } else {
          assetStatesOnChainData[partitionClass] = [assetStateOnChainData];
        }
      }

      for (let index2 = 0; index2 < defaultPartitions.length; index2++) {
        const defaultPartition = defaultPartitions[index2];

        if (totalPartitions.indexOf(defaultPartition) < 0) {
          const partitionClass: string =
            this.retrieveAssetClassFromPartition(defaultPartition);
          const partitionState: TokenState =
            this.retrieveTokenStateFromPartition(defaultPartition);
          const assetStateOnChainData: AssetStateOnChainData = {
            [TokenKeys.ASSET_CLASSES_ON_CHAIN_STATES_NAME]: partitionState,
            [TokenKeys.ASSET_CLASSES_ON_CHAIN_STATES_TOTAL_SUPPLY]: 0,
            [TokenKeys.ASSET_CLASSES_ON_CHAIN_STATES_ERC20_COMPLIANT]: true,
            [TokenKeys.ASSET_CLASSES_ON_CHAIN_STATES_PARTITION]:
              defaultPartition,
          };
          if (
            assetStatesOnChainData[partitionClass] &&
            assetStatesOnChainData[partitionClass].length > 0
          ) {
            assetStatesOnChainData[partitionClass].push(assetStateOnChainData);
          } else {
            assetStatesOnChainData[partitionClass] = [assetStateOnChainData];
          }
        }
      }

      Object.keys(assetStatesOnChainData).map((partitionClass: string) => {
        const assetClassTotalSupply: number = assetStatesOnChainData[
          partitionClass
        ].reduce((supply: number, currentAssetState: AssetStateOnChainData) => {
          return (
            addNumbersByConvertingIntoBigNumber(supply, currentAssetState[
                TokenKeys.ASSET_CLASSES_ON_CHAIN_STATES_TOTAL_SUPPLY
              ])
          );
        }, 0);
        const assetClassOnChainData: AssetClassOnChainData = {
          [TokenKeys.ASSET_CLASSES_ON_CHAIN_NAME]: partitionClass,
          [TokenKeys.ASSET_CLASSES_ON_CHAIN_TOTAL_SUPPLY]:
            assetClassTotalSupply,
          [TokenKeys.ASSET_CLASSES_ON_CHAIN_PERCENTAGE]:
            tokenTotalSupply > 0
              ? (100 * assetClassTotalSupply) / tokenTotalSupply
              : 0,
          [TokenKeys.ASSET_CLASSES_ON_CHAIN_STATES]:
            assetStatesOnChainData[partitionClass],
        };
        assetClassesOnChainData.push(assetClassOnChainData);
      });
      return assetClassesOnChainData;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving ERC20-cmopliant classes and states from ERC20-compliant partitions',
        'retrieveFormattedClassesAndStatesFromOnChainData',
        false,
        500,
      );
    }
  }

  checkStateIsERC20Compliant(tokenState: TokenState): boolean {
    try {
      if (!stateRules[tokenState]) {
        ErrorService.throwError(`token state (${tokenState}) doesnt exist`);
      }

      if (stateRules[tokenState][TokenRule.ERC20_COMPLIANT]) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking if state is ERC20-compliant',
        'checkStateIsERC20Compliant',
        false,
        500,
      );
    }
  }

  checkTokenStateIsValid(tokenState: TokenState): boolean {
    try {
      if (!tokenState) {
        ErrorService.throwError('missing input parameter (token state)');
      }

      if (this.allTokenStates.indexOf(tokenState) < 0) {
        ErrorService.throwError(
          `state ${tokenState} doesn't belong to the list of accepted states: ${JSON.stringify(
            this.allTokenStates,
          )}`,
        );
      }

      return true;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        "checking token state's validity",
        'checkTokenStateIsValid',
        false,
        500,
      );
    }
  }

  checkTokenClassIsValid(token: Token, tokenClass: string): boolean {
    try {
      if (!tokenClass) {
        ErrorService.throwError('missing input parameter (token class)');
      }

      const lowerCaseTokenClasses = token[TokenKeys.ASSET_CLASSES].map(
        (tokenClass) => {
          return tokenClass.toLowerCase();
        },
      );

      if (lowerCaseTokenClasses.indexOf(tokenClass.toLowerCase()) < 0) {
        throw new Error(
          `class ${tokenClass} doesn't belong to the list of accepted classes: ${JSON.stringify(
            token[TokenKeys.ASSET_CLASSES],
          )}`,
        );
      }

      return true;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        "checking token class' validity",
        'checkTokenClassIsValid',
        false,
        500,
      );
    }
  }

  checkTokenStateRequiresKyc(tokenState: TokenState): boolean {
    try {
      if (!stateRules[tokenState]) {
        ErrorService.throwError('token state doesnt exist');
      }

      if (stateRules[tokenState][TokenRule.KYC_REQUIRED]) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking if token state requires KYC',
        'checkTokenStateRequiresKyc',
        false,
        500,
      );
    }
  }

  checkTokenStateAllowsTransfer(tokenState: TokenState) {
    try {
      if (!stateRules[tokenState]) {
        ErrorService.throwError('token state doesnt exist');
      }

      if (stateRules[tokenState][TokenRule.OWNER_CAN_CHANGE]) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking if token state allows token transfer',
        'checkTokenStateAllowsTransfer',
        false,
        500,
      );
    }
  }
}
