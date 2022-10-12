import winston from 'src/old/config/logger';

import { stateRules, TokenRule, TokenState } from 'src/types/states';
import { ASSET_CLASSES, ERC20_COMPLIANT_ASSET_STATES } from 'src/types/token';

class Partitions {
  constructor() {
    this.tokenStates = this.getAvailableTokenStates();
  }
  ASCIIToHexa(_str, _fillTo) {
    const arr1 = [];
    for (let n = 0, l = _str.length; n < l; n++) {
      const hex = Number(_str.charCodeAt(n)).toString(16);
      arr1.push(hex);
    }
    for (let m = _str.length; m < _fillTo; m++) {
      arr1.push(0);
      arr1.push(0);
    }
    return arr1.join('');
  }

  hexaToASCII(str1) {
    const hex = str1.toString();
    let str = '';
    for (let n = 0; n < hex.length; n += 2) {
      str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
    }
    return str;
  }

  getAvailableTokenStates() {
    return Object.keys(stateRules);
  }

  /**
   *	Creates a partition in the right format (bytes32 in solidity)
   *	 - The 12 first bytes (on the left) contain the state of the asset (e.g. locked | reserved | issued | collateral)
   *	 - The 20 next bytes (on the right) contain the class of the asset (class to be chosen by the issuer)
   */
  createPartition(_assetState, _assetClass) {
    _assetState = _assetState ? _assetState : '';
    _assetClass = _assetClass ? _assetClass : '';

    if (_assetState.length >= 12) {
      return winston.rejectError(
        'createPartition: asset state shall not exceed 12 characters',
      );
    }
    if (_assetClass.length >= 20) {
      return winston.rejectError(
        'createPartition: asset class shall not exceed 20 characters',
      );
    }
    const assetStateHex = this.ASCIIToHexa(_assetState.toLowerCase(), 12);
    const assetClassHex = this.ASCIIToHexa(_assetClass.toLowerCase(), 20);
    return '0x'.concat(assetStateHex.concat(assetClassHex));
  }

  listAllPartitionsForAssetClass(_assetClass) {
    const partitionsForClass = this.tokenStates.map((assetState) => {
      return this.createPartition(assetState, _assetClass);
    });
    return partitionsForClass;
  }

  createAllPartitionsForAssetClasses(_assetClasses) {
    let allPartitions = [];
    if (_assetClasses && _assetClasses.length > 0) {
      _assetClasses.map((assetClass) => {
        const createdPartitions = this.listAllPartitionsForAssetClass(
          assetClass,
        );
        createdPartitions.map((createdPartition) => {
          allPartitions.push(createdPartition);
        });
      });
    } else {
      allPartitions = this.listAllPartitionsForAssetClass('');
    }
    return allPartitions;
  }

  createERC20CompliantPartitionsForEachAssetClass(_assetClasses) {
    try {
      const erc20CompliantPartitions = [];

      this.tokenStates.map((tokenState) => {
        if (this.stateIsERC20Compliant(tokenState)) {
          if (_assetClasses && _assetClasses.length > 0) {
            _assetClasses.map((assetClass) => {
              const newPartition = this.createPartition(tokenState, assetClass);
              erc20CompliantPartitions.push(newPartition);
            });
          } else {
            const newPartition = this.createPartition(tokenState, '');
            erc20CompliantPartitions.push(newPartition);
          }
        }
      });

      return erc20CompliantPartitions;
    } catch (error) {
      throw new Error(
        `createERC20CompliantPartitionsForEachAssetClass --> ${error.message}`,
      );
    }
  }

  retrieveAssetClassFromPartition(_partition) {
    if (_partition.length !== 66) {
      return winston.rejectError(
        'retrieveAssetClassFromPartition: a partition shall be exactly 32 bytes long',
      );
    }
    const assetClassHex = _partition.substring(24, 64);
    return this.hexaToASCII(assetClassHex).replace(/\0/g, '');
  }

  retrieveTokenStateFromPartition(_partition) {
    if (_partition.length !== 66) {
      return winston.rejectError(
        'retrieveAssetClassFromPartition: a partition shall be exactly 32 bytes long',
      );
    }
    const assetStateHex = _partition.substring(0, 24);
    return this.hexaToASCII(assetStateHex).replace(/\0/g, '');
  }

  getLockedPartitionForAssetClass(_assetClass) {
    return this.createPartition(TokenState.LOCKED, _assetClass);
  }

  getReservedPartitionForAssetClass(_assetClass) {
    return this.createPartition(TokenState.RESERVED, _assetClass);
  }

  getCollateralizedPartitionForAssetClass(_assetClass) {
    return this.createPartition(TokenState.COLLATERAL, _assetClass);
  }

  getIssuedPartitionForAssetClass(_assetClass) {
    return this.createPartition(TokenState.ISSUED, _assetClass);
  }

  checkTokenClassValidity(_ctx, _token, _tokenClass) {
    try {
      if (!_tokenClass) {
        throw new Error('missing input parameter (token class)');
      }

      const copyAssetClasses = _token[ASSET_CLASSES].map((assetclass) => {
        return assetclass.toLowerCase();
      });

      if (copyAssetClasses.indexOf(_tokenClass.toLowerCase()) < 0) {
        throw new Error(
          `class ${_tokenClass} doesn't belong to the list of accepted classes: ${JSON.stringify(
            _token[ASSET_CLASSES],
          )}`,
        );
      }
    } catch (error) {
      throw new Error(`checkTokenClassValidity --> ${error.message}`);
    }
  }

  checkTokenStateValidity(_ctx, _tokenState) {
    try {
      if (!_tokenState) {
        throw new Error('missing input parameter (token state)');
      }

      if (this.tokenStates.indexOf(_tokenState) < 0) {
        throw new Error(
          `state ${_tokenState} doesn't belong to the list of accepted states: ${JSON.stringify(
            this.tokenStates,
          )}`,
        );
      }
    } catch (error) {
      throw new Error(`checkTokenStateValidity --> ${error.message}`);
    }
  }

  stateRequiresKyc(tokenState) {
    try {
      if (!stateRules[tokenState]) {
        throw new Error('token state doesnt exist');
      }

      if (stateRules[tokenState][TokenRule.KYC_REQUIRED]) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      throw new Error(`stateRequiresKyc --> ${error.message}`);
    }
  }

  stateIsERC20Compliant(tokenState) {
    try {
      if (!stateRules[tokenState]) {
        throw new Error('token state doesnt exist');
      }

      if (stateRules[tokenState][TokenRule.ERC20_COMPLIANT]) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      throw new Error(`stateIsERC20Compliant --> ${error.message}`);
    }
  }

  stateAllowsTokenOwnerToChange(tokenState) {
    try {
      if (!stateRules[tokenState]) {
        throw new Error('token state doesnt exist');
      }

      if (stateRules[tokenState][TokenRule.OWNER_CAN_CHANGE]) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      throw new Error(`stateAllowsTokenOwnerToChange --> ${error.message}`);
    }
  }

  formatPartitionsArray(partitionsArray) {
    try {
      const response = [];
      const classesData = {};
      partitionsArray.map((partition) => {
        const partitionClass = this.retrieveAssetClassFromPartition(partition);
        const partitionState = this.retrieveTokenStateFromPartition(partition);
        if (
          classesData[partitionClass] &&
          classesData[partitionClass].length > 0
        ) {
          classesData[partitionClass].push(partitionState);
        } else {
          classesData[partitionClass] = [partitionState];
        }
      });
      Object.keys(classesData).map((partitionClass) => {
        response.push({
          class: partitionClass,
          [ERC20_COMPLIANT_ASSET_STATES]: classesData[partitionClass],
        });
      });
      return response;
    } catch (error) {
      throw new Error(`formatPartitionsArray --> ${error.message}`);
    }
  }
}

const myPartitions = new Partitions();

export default myPartitions;
