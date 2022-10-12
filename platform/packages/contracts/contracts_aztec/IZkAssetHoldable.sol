pragma solidity >=0.5.0 <0.9.0;

interface IZkAssetHoldable {
    enum HoldStatusCode {Nonexistent, Held, Executed, Released}

    event NewHold(
        bytes32 indexed holdId,
        address indexed sender,
        bytes32[] inputNoteHashes,
        bytes32[] outputNoteHashes,
        address indexed notary,
        uint256 expirationDateTime,
        bytes32 lockHash
    );
    event ExecutedHold(bytes32 indexed holdId, bytes32 lockPreimage);
    event ReleaseHold(bytes32 indexed holdId);

    /**
     @notice Called by the sender to hold input notes of a proof that the sender can not release back to themself until after the expiration date.
     @param proofId Aztec proof identifier.
     @param proofOutput Aztec JoinSplit proof output.
     @param notary account that can execute the hold.
     @param expirationDateTime UNIX epoch seconds the held amount can be released back to the sender by the sender. Past dates are allowed.
     @param lockHash optional keccak256 hash of a lock preimage. An empty hash will not enforce the hash lock when the hold is executed.
     @param holdSignature  EIP712 signature of the hold from the spender.
     @return a unique identifier for the hold.
     */
    function holdProof(
        uint24 proofId,
        bytes calldata proofOutput,
        address notary,
        uint256 expirationDateTime,
        bytes32 lockHash,
        bytes calldata holdSignature
    ) external returns (bytes32 holdId);

    /**
     @notice Called by the notary to transfer the held tokens to the recipient if the is no hold lock hash.
     @param holdId a unique identifier for the hold.
     */
    function executeHold(bytes32 holdId) external;

    /**
     @notice Called by the notary to transfer the held tokens to the recipient.
     @param holdId a unique identifier for the hold.
     @param lockPreimage the image used to generate the lock hash with a keccak256 hash
     */
    function executeHold(bytes32 holdId, bytes32 lockPreimage) external;

    /**
     @notice Called by the sender after the expiration date to release the held tokens so they have control of them again.
     @param holdId a unique identifier for the hold.
     @param releaseSignature  EIP712 signature of the release from the spender.
     */
    function releaseHold(bytes32 holdId, bytes calldata releaseSignature)
        external;

    /**
     @param holdId a unique identifier for the hold.
     @return hold status code.
     */
    function holdStatus(bytes32 holdId) external view returns (HoldStatusCode);
}
