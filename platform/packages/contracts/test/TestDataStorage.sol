pragma solidity ^0.6.9;

import "truffle/build/Assert.sol";
import "../codefi_contracts/DataStorage.sol";

contract TestDataStorage {
    DataStorage dataStorage;
    function beforeEach() public {
        dataStorage = new DataStorage();
    }

    function testStoreString() public {
        string memory id = "id";
        string memory str = "asuiodalijuenaw123871!@)%@#!%";
        dataStorage.storeString(id, str);

        Assert.equal(dataStorage.getString(id), str, "Wrong string stored");
    }
}