pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "./DataStorage.sol";


/**
 * @title Private Channel contract
 */
contract PrivateChannel {

    enum ClientType {
      BESU,
      QUORUM
    }

    event PrivateChannelCreated(
        string channelId,
        string name,
        string description,
        ClientType clientType,
        string[] participants,
        address creator
    );

    event DataShared(string id, string channelId, string data, address sender);

    DataStorage public dataStorage;

    constructor(
        string memory channelId,
        string memory name,
        string memory description,
        ClientType clientType,
        string[] memory participants
    )
      public
    {
      dataStorage = new DataStorage();

      emit PrivateChannelCreated(
        channelId,
        name,
        description,
        clientType,
        participants,
        msg.sender
      );
    }

    /**
    * @dev Shares data in the private channel
    * @param _id the id to identify the data being shared
    * @param _channelId channel used to share this data - informative
    * @param _data the json data to be shared
    */
    function shareData(string calldata _id, string calldata _channelId, string calldata _data)
      external
    {
        dataStorage.storeString(_id, _data);
        emit DataShared(_id, _channelId, _data, msg.sender);
    }
}
