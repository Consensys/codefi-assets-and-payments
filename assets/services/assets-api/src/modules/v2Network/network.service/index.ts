import { Injectable } from '@nestjs/common';

import {
  keys as NetworkKeys,
  Network,
  FinalizedNetwork,
} from 'src/types/network';

import {
  ListAllNetworksOutput,
  NetworkBodyInput,
  ListNetworksOutput,
  RetrieveNetworkOutput,
} from 'src/modules/v2Network/network.dto';

import ErrorService from 'src/utils/errorService';
import { ApiSCCallService } from 'src/modules/v2ApiCall/api.call.service/sc';
import { ApiNetworkCallService } from 'src/modules/v2ApiCall/api.call.service/network';
import { DEFAULT_TENANT_ID } from 'src/types/clientApplication';
import { M2mTokenService } from '@codefi-assets-and-payments/auth';
import { IHeaders, IFaucet } from 'pegasys-orchestrate';

@Injectable()
export class NetworkService {
  constructor(
    private readonly apiSCCallService: ApiSCCallService,
    private readonly apiNetworkCallService: ApiNetworkCallService,
    private m2mTokenService: M2mTokenService,
  ) {}
  /**
   * [List all networks, available in Orchestrate transaction orchestration layer]
   * Returns the list of available networks an issuer can choose when creating a
   * new asset. A default network is also specified for the cases when a network
   * is not indicated.
   */
  async listAllNetworks(tenantId: string): Promise<ListAllNetworksOutput> {
    try {
      const allNetworks: ListAllNetworksOutput =
        await this.apiSCCallService.listAllNetworks();

      allNetworks.networks = allNetworks.networks
        .map((network: Network) => {
          const rpcEndpoint: string =
            network[NetworkKeys.URLS] && network[NetworkKeys.URLS].length > 0
              ? network[NetworkKeys.URLS][0]
              : undefined;
          return {
            ...network,
            [NetworkKeys.URLS]: undefined,
            [NetworkKeys.RPC_ENDPOINT]: rpcEndpoint,
            [NetworkKeys.FAUCET_MNEMONIC]: undefined,
          };
        })
        .filter((network: Network) => {
          return (
            network[NetworkKeys.TENANT_ID] === tenantId ||
            network[NetworkKeys.TENANT_ID] === DEFAULT_TENANT_ID
          );
        });

      return {
        ...allNetworks,
        message: `${allNetworks.networks.length} network(s) listed successfully`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'lisiting all networks',
        'listAllNetworks',
        false,
        500,
      );
    }
  }

  async createFaucet(
    networkKey: string,
    faucetWallet: string,
    tenantId: string,
    name: string,
    authToken: string,
  ): Promise<IFaucet> {
    try {
      return this.apiSCCallService.createFaucet(
        networkKey,
        faucetWallet,
        tenantId,
        name,
        authToken,
      );
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating faucet',
        'createFaucet',
        false,
        500,
      );
    }
  }

  /**
   * [List valid networks chaindIds, keys, as well as a "chainIdToFirstMatchingNetworkKey" mapping]
   */
  async retrieveValidNetworksMap(tenantId: string): Promise<{
    validChainIdsMap: {
      [chainId: string]: boolean;
    };
    validNetworkKeysMap: {
      [networkKey: string]: boolean;
    };
    chainIdToFirstMatchingNetworkKey: {
      [chainId: string]: string;
    };
    defaultNetworkKey: string;
  }> {
    try {
      const networkInfo: ListAllNetworksOutput = await this.listAllNetworks(
        tenantId,
      );

      const validChainIdsMap: {
        [chainId: string]: boolean;
      } = {};

      const validNetworkKeysMap: {
        [networkKey: string]: boolean;
      } = {};

      const chainIdToFirstMatchingNetworkKey: {
        [chainId: string]: string;
      } = {};

      networkInfo.networks.map((network: Network) => {
        validChainIdsMap[network[NetworkKeys.CHAIN_ID]] = true;
        validNetworkKeysMap[network[NetworkKeys.KEY]] = true;
      });

      for (const networkChainId of Object.keys(validChainIdsMap)) {
        // This mapping is important because it replicates the behaviour the API used to have before,
        // e.g. when it was fully based on 'chainIds' => it was selecting the first matching network,
        // based on the 'find' function.
        const firstMatchingNetworkKey = networkInfo.networks.find(
          (network: Network) =>
            networkChainId
              ? network[NetworkKeys.CHAIN_ID] === networkChainId.toString()
              : false,
        );
        chainIdToFirstMatchingNetworkKey[networkChainId] =
          firstMatchingNetworkKey?.[NetworkKeys.KEY];
      }

      return {
        validChainIdsMap,
        validNetworkKeysMap,
        chainIdToFirstMatchingNetworkKey,
        defaultNetworkKey: networkInfo.defaultNetwork,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving valid networks map',
        'retrieveValidNetworksMap',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve network]
   *
   * This function is used to retrieve the network from config file, based on the provided chainId
   *
   */
  async retrieveNetwork(
    tenantId: string,
    chainId: string | null, // TO BE DEPRECATED (replaced by 'networkKey')
    networkKey: string,
    networkShallExist: boolean,
  ): Promise<Network> {
    try {
      const networkInfo: ListAllNetworksOutput = await this.listAllNetworks(
        tenantId,
      );

      // Retrieve network either by chain Id or by network key
      const network: Network = networkInfo.networks.find((network: Network) =>
        networkKey // Use networkKey in priority
          ? network[NetworkKeys.KEY] === networkKey
          : chainId // TO BE DEPRECATED (replaced by 'networkKey')
          ? network[NetworkKeys.CHAIN_ID] === chainId.toString()
          : false,
      );

      if (network) {
        // Check network is alive
        try {
          await this.apiSCCallService.testNetworkIsAlive(network);
          network[NetworkKeys.IS_ALIVE] = true;
        } catch (error) {
          network[NetworkKeys.IS_ALIVE] = false;
        }

        return network;
      } else {
        if (networkShallExist) {
          ErrorService.throwError(
            chainId
              ? `no network with chainId ${chainId.toString()} was found in config.networks.js`
              : `no network with key ${networkKey} was found in config.networks.js`,
          );
        } else {
          return undefined;
        }
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving network',
        'retrieveNetwork',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve default network]
   *
   * This function is used to retrieve the default network from config file, in the
   * case when it is not indicated in the "ethService" object.
   *
   */
  async retrieveDefaultNetwork(
    tenantId: string,
    checkNetworkIsAlive: boolean,
  ): Promise<Network> {
    try {
      const networkInfo: ListAllNetworksOutput = await this.listAllNetworks(
        tenantId,
      );

      const fetchedDefaultNetwork: Network =
        networkInfo.networks.find(
          (network: Network) => network[NetworkKeys.TENANT_ID] === tenantId,
        ) ||
        networkInfo.networks.find(
          (network: Network) =>
            network[NetworkKeys.KEY] === networkInfo.defaultNetwork,
        );

      if (fetchedDefaultNetwork) {
        // Check network is alive
        if (checkNetworkIsAlive) {
          try {
            await this.apiSCCallService.testNetworkIsAlive(
              fetchedDefaultNetwork,
            );
            fetchedDefaultNetwork[NetworkKeys.IS_ALIVE] = true;
          } catch (error) {
            fetchedDefaultNetwork[NetworkKeys.IS_ALIVE] = false;
          }
        }

        return fetchedDefaultNetwork;
      } else {
        ErrorService.throwError(
          'missing defaultNetwork in config.networks.js',
        );
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving default network',
        'retrieveDefaultNetwork',
        false,
        500,
      );
    }
  }

  /**
   * [Get networks]
   *
   * This function gets all networks registered in Network API
   *
   */
  async getNetworks(
    authToken: string,
    key?: string,
  ): Promise<ListNetworksOutput> {
    try {
      const response = await this.apiNetworkCallService.listAllNetworks(
        authToken,
        key,
      );
      const networks: FinalizedNetwork[] = response.items;

      if (networks) {
        return {
          networks,
          message: `${networks.length} network(s) listed successfully`,
        };
      } else {
        ErrorService.throwError('Problems while getting networks');
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'get networks',
        'getNetworks',
        false,
        500,
        error.response?.downstreamStatus,
      );
    }
  }

  /**
   * [Get network]
   *
   * This function gets one registered in Network API
   *
   */
  async getNetwork(
    authToken: string,
    key: string,
  ): Promise<RetrieveNetworkOutput> {
    try {
      const response = await this.apiNetworkCallService.retrieveNetwork(
        authToken,
        key,
      );
      const network: FinalizedNetwork = response;

      if (network) {
        return {
          network,
          message: 'network listed successfully',
        };
      } else {
        ErrorService.throwError(`Problems while retrieving network: ${key}`);
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'get network',
        'getNetwork',
        false,
        500,
        error.response?.downstreamStatus,
      );
    }
  }

  /**
   * [Delete network]
   *
   * This function is used to delete a  network
   *
   */
  async deleteNetwork(
    key: string,
    authToken: string,
  ): Promise<{
    message: string;
  }> {
    try {
      const deletedNetworkResponse: {
        message: string;
      } = await this.apiNetworkCallService.deleteNetwork(key, authToken);

      if (deletedNetworkResponse) {
        return deletedNetworkResponse;
      } else {
        ErrorService.throwError(`Problems while deleting network: ${key}`);
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'deleting network',
        'deleteNetwork',
        false,
        500,
        error.response?.downstreamStatus,
      );
    }
  }

  /**
   * [Create network]
   *
   * This function is used to create a new network
   *
   */
  async createNetwork(
    networkDetails: NetworkBodyInput,
    authToken: string,
    multiTenantHeaders: IHeaders,
  ): Promise<Network> {
    try {
      const network: Network = await this.apiNetworkCallService.createNetwork(
        networkDetails,
        authToken,
        multiTenantHeaders,
      );

      if (network) {
        return network;
      } else {
        ErrorService.throwError(
          `Problems while creating network: ${networkDetails.name}`,
        );
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating network',
        'createNetwork',
        false,
        500,
        error.response?.downstreamStatus,
      );
    }
  }
}
