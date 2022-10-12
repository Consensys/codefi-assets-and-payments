import { SERVICE_TYPES, FILTERED_NETWORKS } from '../config/constants';
import { EthService, EthServiceType } from '../types';

/**
 * [Check ethService type]
 */
export const checkEthServiceType = (_type) => {
  try {
    if (SERVICE_TYPES.includes(_type)) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    throw new Error(`checkEthServiceType --> ${error.message}`);
  }
};

/**
 * [Extract chainKey from EthService]
 */
export const extractChainKeyFromEthService = (
  ethService: EthService,
): string => {
  try {
    if (ethService && ethService.data && ethService.data.key) {
      return ethService.data.key;
    } else {
      throw new Error('invalid ethService (doesnt contain chain name/key)');
    }
  } catch (error) {
    throw new Error(`extractChainKeyFromEthService --> ${error.message}`);
  }
};

/**
 * [Create ethService]
 */
export const createEthService = (
  ethServiceType: EthServiceType,
  chainKey: string,
): EthService => {
  try {
    if (!SERVICE_TYPES.includes(ethServiceType)) {
      throw new Error(`unknown ethService type ${ethServiceType}`);
    }

    let ethServiceNetwork;
    FILTERED_NETWORKS.forEach((network) => {
      if (network.key === chainKey) {
        ethServiceNetwork = network;
      }
    });
    if (!(ethServiceNetwork && ethServiceNetwork.urls)) {
      throw new Error(`unknown chain key ${chainKey}`);
    }

    return {
      type: ethServiceType,
      data: {
        ...ethServiceNetwork,
        rpcEndpoint: ethServiceNetwork.urls[0],
        key: ethServiceNetwork.key,
      },
    };
  } catch (error) {
    throw new Error(`createEthService --> ${error.message}`);
  }
};

export const formatAllArgs = (allArgs) => {
  if (typeof allArgs === 'object' && allArgs.push !== undefined) {
    return allArgs.map((args) => {
      return formatAllArgs(args);
    });
  } else {
    return formatArgs(allArgs);
  }
};

export const formatArgs = (args) => {
  if (typeof args === 'number') {
    return formatIntToHex(args);
  } else if (typeof args === 'string') {
    switch (args) {
      case 'true':
        return true;
      case 'false':
        return false;
      default:
        return args;
    }
  } else {
    return args;
  }
};

export const formatIntToHex = (x) => {
  if (typeof x === 'string') {
    if (x.substring(0, 2) === '0x') {
      return x;
    } else {
      throw new Error(`invalid input(1), not a number: ${x}`);
    }
  } else if (typeof x === 'number' && x >= 1e20) {
    throw new Error(
      `invalid input(2), number is higher than 1e20 (${x}) --> it shall be passed as a 0x-prefixed hexstring`,
    );
  } else if (typeof x === 'number') {
    return '0x'.concat(x.toString(16));
  } else {
    throw new Error(`invalid input(3), not a number: ${x}`);
  }
};

export const formatEmptyArgs = (argsType) => {
  if (argsType === 'bytes32') {
    return '0x0000000000000000000000000000000000000000000000000000000000000000';
  } else if (argsType === 'address') {
    return '0x0000000000000000000000000000000000000000';
  } else if (argsType === 'uint256') {
    return '0x0000000000000000000000000000000000000000000000000000000000000000';
  } else if (argsType === 'string') {
    return '0x0000000000000000000000000000000000000000000000000000000000000000';
  } else if (argsType === 'bool') {
    return false;
  } else {
    return '0x';
  }
};
