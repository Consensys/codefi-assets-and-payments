pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;


/**
 * @title Data Storage contract
 */
contract DataStorage {

    enum Type {
        UNSET,
        OBJECT,
        STRING,
        UINT,
        BYTES32,
        ADDRESS,
        BOOL
    }

    struct Metadata {
        uint256 lastUpdatedAt; // timestamp
        address owner;
    }

    event ObjectStored(address sender, string id);
    event ObjectUpdated(address sender, string id);
    event JsonStored(address sender, string id, string value, string valueMetadata);
    event StringStored(address sender, string id, string value);
    event UintStored(address sender, string id, uint256 value);
    event Bytes32Stored(address sender, string id, bytes32 value);
    event AddressStored(address sender, string id, address value);
    event BoolStored(address sender, string id, bool value);

    // idHash => metadata
    mapping(bytes32 => Metadata) metadata;
    // idHash => Type
    mapping(bytes32 => Type) types;

    mapping(bytes32 => string) stringStorage;
    mapping(bytes32 => uint256) uint256Storage;
    mapping(bytes32 => bytes32) bytes32Storage;
    mapping(bytes32 => address) addressStorage;
    mapping(bytes32 => bool) boolStorage;

   /**
    * @dev Stores an object
    * @param id the id to identify the object being stored
    * @param keys the keys of the object
    * @param values the bytes values that will be stored
    * @param _types the Types used to determine how to decode and store each value
    */
    function storeObject(string calldata id, bytes32[] calldata keys, bytes[] calldata values, Type[] calldata _types) external {
        require(
            keys.length == values.length && keys.length == _types.length,
            "Keys, values and types must be the same length"
        );

        require(!_storeMetadata(_hashId(id), Type.OBJECT), "Object already exists");

        for (uint256 i = 0; i < keys.length; i++) {
            bytes32 key = keys[i];
            bytes32 fieldId = _fieldId(id, key);
            require(
                types[fieldId] == Type.UNSET,
                "Field id already being used by a root value"
            );
            Type t = _types[i];
            types[fieldId] = t;
            _storeBytes(fieldId, values[i], t);
        }

        emit ObjectStored(msg.sender, id);
    }

   /**
    * @dev Updates an existing object
    * @param id the id to identify the object being stored
    * @param keys the keys that will be updated
    * @param values the bytes values for the specified keys
    */
    function updateObject(string calldata id, bytes32[] calldata keys, bytes[] calldata values) external {
        require(
            keys.length == values.length,
            "Keys and values must be the same length"
        );

        require(keys.length > 0, "At least one key and value must be updated");

        require(_storeMetadata(_hashId(id), Type.OBJECT), "Object doesn't exist");

        for (uint256 i = 0; i < keys.length; i++) {
            bytes32 key = keys[i];
            bytes32 fieldId = _fieldId(id, key);
            _storeBytes(fieldId, values[i], types[fieldId]);
        }

        emit ObjectUpdated(msg.sender, id);
    }

   /**
    * @dev Stores or updates a JSON string
    * @param id the id to identify the string being stored
    * @param val the string that will be stored
    */
    function storeJson(string calldata id, string calldata val, string calldata valueMetadata) external {
        bytes32 idHash = _hashId(id);
        _storeMetadata(idHash, Type.STRING);
        stringStorage[idHash] = val;
        emit JsonStored(msg.sender, id, val, valueMetadata);
    }

   /**
    * @dev Stores or updates a string
    * @param id the id to identify the string being stored
    * @param val the string that will be stored
    */
    function storeString(string calldata id, string calldata val) external {
        bytes32 idHash = _hashId(id);
        _storeMetadata(idHash, Type.STRING);
        stringStorage[idHash] = val;
        emit StringStored(msg.sender, id, val);
    }

   /**
    * @dev Stores or updates a uint256
    * @param id the id to identify the uint256 being stored
    * @param val the uint256 that will be stored
    */
    function storeUint256(string calldata id, uint256 val) external {
        bytes32 idHash = _hashId(id);
        _storeMetadata(idHash, Type.UINT);
        uint256Storage[idHash] = val;
        emit UintStored(msg.sender, id, val);
    }

   /**
    * @dev Stores or updates a bytes32
    * @param id the id to identify the bytes32 being stored
    * @param val the bytes32 that will be stored
    */
    function storeBytes32(string calldata id, bytes32 val) external {
        bytes32 idHash = _hashId(id);
        _storeMetadata(idHash, Type.BYTES32);
        bytes32Storage[idHash] = val;
        emit Bytes32Stored(msg.sender, id, val);
    }

   /**
    * @dev Stores or updates a address
    * @param id the id to identify the address being stored
    * @param val the address that will be stored
    */
    function storeAddress(string calldata id, address val) external {
        bytes32 idHash = _hashId(id);
        _storeMetadata(idHash, Type.ADDRESS);
        addressStorage[idHash] = val;
        emit AddressStored(msg.sender, id, val);
    }

   /**
    * @dev Stores or updates a boolean
    * @param id the id to identify the boolean being stored
    * @param val the boolean that will be stored
    */
    function storeBool(string calldata id, bool val) external {
        bytes32 idHash = _hashId(id);
        _storeMetadata(idHash, Type.BOOL);
        boolStorage[idHash] = val;
        emit BoolStored(msg.sender, id, val);
    }

   /**
    * @dev Gets a string stored in an object
    * @param objectId the id of the object that contains the string
    * @param key the key in which the string is stored
    * @return the string stored in the given key of the object
    */
    function getString(string calldata objectId, bytes32 key) external view returns(string memory) {
        return _getString(_fieldId(objectId, key));
    }

   /**
    * @dev Gets a uint256 stored in an object
    * @param objectId the id of the object that contains the uint256
    * @param key the key in which the uint256 is stored
    * @return the uint256 stored in the given key of the object
    */
    function getUint256(string calldata objectId, bytes32 key) external view returns(uint256) {
        return _getUint256(_fieldId(objectId, key));
    }

   /**
    * @dev Gets a bytes32 stored in an object
    * @param objectId the id of the object that contains the bytes32
    * @param key the key in which the bytes32 is stored
    * @return the bytes32 stored in the given key of the object
    */
    function getBytes32(string calldata objectId, bytes32 key) external view returns(bytes32) {
        return _getBytes32(_fieldId(objectId, key));
    }

   /**
    * @dev Gets a address stored in an object
    * @param objectId the id of the object that contains the address
    * @param key the key in which the address is stored
    * @return the address stored in the given key of the object
    */
    function getAddress(string calldata objectId, bytes32 key) external view returns(address) {
        return _getAddress(_fieldId(objectId, key));
    }

   /**
    * @dev Gets a bool stored in an object
    * @param objectId the id of the object that contains the bool
    * @param key the key in which the bool is stored
    * @return the bool stored in the given key of the object
    */
    function getBool(string calldata objectId, bytes32 key) external view returns(bool) {
        return _getBool(_fieldId(objectId, key));
    }

   /**
    * @dev Gets the type of a field stored in an object
    * @param objectId the id of the object
    * @param key the key of the field
    * @return the type of the field
    */
    function getType(string calldata objectId, bytes32 key) external view returns(Type) {
        return _getType(_fieldId(objectId, key));
    }

   /**
    * @dev Gets a string value
    * @param id the id of the string
    * @return the string stored in the given id
    */
    function getString(string calldata id) external view returns(string memory) {
        return _getString(_hashId(id));
    }

   /**
    * @dev Gets a uint256 value
    * @param id the id of the uint256
    * @return the uint256 stored in the given id
    */
    function getUint256(string calldata id) external view returns(uint256) {
        return _getUint256(_hashId(id));
    }

   /**
    * @dev Gets a bytes32 value
    * @param id the id of the bytes32
    * @return the bytes32 stored in the given id
    */
    function getBytes32(string calldata id) external view returns(bytes32) {
        return _getBytes32(_hashId(id));
    }

   /**
    * @dev Gets an address value
    * @param id the id of the address
    * @return the address stored in the given id
    */
    function getAddress(string calldata id) external view returns(address) {
        return _getAddress(_hashId(id));
    }

   /**
    * @dev Gets a bool value
    * @param id the id of the bool
    * @return the bool stored in the given id
    */
    function getBool(string calldata id) external view returns(bool) {
        return _getBool(_hashId(id));
    }

   /**
    * @dev Gets the type of a value
    * @param id the id of the value
    * @return the type of the value
    */
    function getType(string calldata id) external view returns(Type) {
        return _getType(_hashId(id));
    }

   /**
    * @dev Gets the type of a field stored in an object
    * @param id the id of the value
    * @return the type of the value
    */
    function getMetadata(string calldata id) external view returns(Metadata memory) {
        return _getMetadata(_hashId(id));
    }

    /* INTERNAL */

    function _getString(bytes32 idHash) internal view returns(string memory) {
        return stringStorage[idHash];
    }

    function _getUint256(bytes32 idHash) internal view returns(uint256) {
        return uint256Storage[idHash];
    }

    function _getBytes32(bytes32 idHash) internal view returns(bytes32) {
        return bytes32Storage[idHash];
    }

    function _getAddress(bytes32 idHash) internal view returns(address) {
        return addressStorage[idHash];
    }

    function _getBool(bytes32 idHash) internal view returns(bool) {
        return boolStorage[idHash];
    }

    function _getType(bytes32 idHash) internal view returns(Type) {
        return types[idHash];
    }

    function _getMetadata(bytes32 idHash) internal view returns(Metadata memory) {
        return metadata[idHash];
    }

   /**
    * @dev Computes the id hash used to store a value
    * @param id the id of the object
    * @return the id hash used to store the value
    */
    function _hashId(string calldata id) internal pure returns(bytes32) {
        return keccak256(bytes(id));
    }

   /**
    * @dev Computes the id used to store an object's value
    * @param id the id of the object
    * @param key the key for the value
    * @return the id used to store the value
    */
    function _fieldId(string calldata id, bytes32 key) internal pure returns(bytes32) {
        return keccak256(abi.encodePacked(id, key));
    }

   /**
    * @dev Stores the metadata and type for the given id
    * @param idHash the hash of the id of the object/value being stored
    * @param t the Type to store for the given id
    * @return exists true if the id has already been used
    */
    function _storeMetadata(bytes32 idHash, Type t) internal returns(bool exists) {
        Metadata storage meta = metadata[idHash];

        meta.lastUpdatedAt = block.timestamp;

        // If owner == 0x, the id is being used for the first time
        if (meta.owner == address(0)) {
            require(types[idHash] == Type.UNSET, "Id already used for object field");
            types[idHash] = t;
            meta.owner = msg.sender;
            return false;
        }

        require(meta.owner == msg.sender, "Not allowed");
        require(types[idHash] == t, "Changing the type of an existing value");
        return true;
    }

   /**
    * @dev Decodes and stores a bytes value depending on the given type
    * @param id the id of the value being stored
    * @param val the value being stored
    * @param t the Type that specifies how to decode and store the value
    */
    function _storeBytes(bytes32 id, bytes calldata val, Type t) internal {
        if (t == Type.STRING) {
            stringStorage[id] = abi.decode(val, (string));
        } else if(t == Type.UINT) {
            uint256Storage[id] = abi.decode(val, (uint256));
        } else if(t == Type.BYTES32) {
            bytes32Storage[id] = abi.decode(val, (bytes32));
        } else if(t == Type.ADDRESS) {
            addressStorage[id] = abi.decode(val, (address));
        } else if(t == Type.BOOL) {
            boolStorage[id] = abi.decode(val, (bool));
        } else {
            revert("Invalid type");
        }
    }
}
