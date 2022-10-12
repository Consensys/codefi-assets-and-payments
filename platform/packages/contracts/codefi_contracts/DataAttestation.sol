pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";


/**
 * @title Data Attestation contract
 */
contract DataAttestation is Ownable {

    event Attest(bytes32 merkleRoot);

    /**
    * @dev Receives a Merkle Tree Root store and emit an event
    * @param _merkleRoot data merkle tree root
    */
    function saveMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        emit Attest(_merkleRoot);
    }
}
