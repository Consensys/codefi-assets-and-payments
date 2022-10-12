pragma solidity >=0.5.0 <0.9.0;

import "./IZkAssetHoldable.sol";
import "./ZkAssetDirect.sol";

contract ZkAssetHoldable is IZkAssetHoldable, ZkAssetDirect {
    string public constant EIP712_DOMAIN =
        "EIP712Domain(string name,string version,address verifyingContract)";
    bytes32 public constant EIP712_DOMAIN_TYPEHASH =
        keccak256(abi.encodePacked(EIP712_DOMAIN));

    bytes32 internal constant HOLD_SIGNATURE_TYPE_HASH =
        keccak256(
            abi.encodePacked(
                "HoldSignature(",
                "bytes32 proofHash,",
                "address notary,",
                "uint256 expirationDateTime,",
                "bytes32 lockHash",
                ")"
            )
        );
    bytes32 internal constant RELEASE_SIGNATURE_TYPE_HASH =
        keccak256(abi.encodePacked("ReleaseSignature(bytes32 holdId)"));

    bytes32 public DOMAIN_SEPARATOR;

    struct HoldData {
        uint24 proofId;
        bytes proofOutput;
        address sender;
        address notary;
        uint256 expirationDateTime;
        bytes32 lockHash;
        HoldStatusCode status;
        bytes32[] inputNotesHashes;
    }

    // mapping of hold ids to hold data
    mapping(bytes32 => HoldData) internal holds;
    // mapping of note hashes that have holds on them
    mapping(bytes32 => bool) internal heldNotes;

    modifier isHeld(bytes32 holdId) {
        require(
            holds[holdId].status == HoldStatusCode.Held,
            "Hold is not in Held status"
        );
        _;
    }

    modifier replaySignature(bytes memory signature) {
        // Prevent possible replay attacks
        bytes32 signatureHash = keccak256(signature);
        require(
            signatureLog[signatureHash] != true,
            "signature has already been used"
        );
        signatureLog[signatureHash] = true;
        _;
    }

    constructor(address _aceAddress, uint256 _scalingFactor)
        public
        ZkAssetDirect(_aceAddress, _scalingFactor)
    {
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                EIP712_DOMAIN_TYPEHASH,
                keccak256("ZK_ASSET"),
                keccak256("1"),
                address(this)
            )
        );
    }

    function splitAndBurnProofs(
        uint24 _splitProofId,
        uint24 _burnProofId,
        bytes calldata _splitProofOutput,
        bytes calldata _burnProofData,
        bytes calldata _splitSignature
    ) external {
        confidentialTransfer(_splitProofId, _splitProofOutput, _splitSignature);
        confidentialBurn(
                _burnProofId, 
                _burnProofData
            );
    }

    function splitAndHoldProofs(
        uint24 _proofId,
        bytes calldata _splitProofOutput,
        bytes calldata _holdProofOutput,
        address _notary,
        uint256 expirationDateTime,
        bytes32 lockHash,
        bytes calldata _splitSignatures,
        bytes calldata _holdSignature
    ) external returns (bytes32 holdId) {
        confidentialTransfer(_proofId, _splitProofOutput, _splitSignatures);
        return
            holdProof(
                _proofId,
                _holdProofOutput,
                _notary,
                expirationDateTime,
                lockHash,
                _holdSignature
            );
    }

    function holdProof(
        uint24 _proofId,
        bytes memory _proofData,
        address _notary,
        uint256 expirationDateTime,
        bytes32 lockHash,
        bytes memory _holdSignature
    ) public replaySignature(_holdSignature) returns (bytes32 holdId) {
        bytes memory proofOutput = _validateProof(_proofId, _proofData);

        holdId = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(
                    abi.encode(
                        HOLD_SIGNATURE_TYPE_HASH,
                        keccak256(proofOutput),
                        _notary,
                        expirationDateTime,
                        lockHash
                    )
                )
            )
        );

        // The sender of the notes is the account that signed the EIP712 Hold instruction, not the msg.sender
        address sender = recoverSignature(holdId, _holdSignature);

        bytes32[] memory inputNoteHashes;
        bytes32[] memory outputNoteHashes;
        (inputNoteHashes, outputNoteHashes) = _holdProofValidateNotes(
            proofOutput,
            sender,
            _notary
        );

        holds[holdId] = HoldData(
            _proofId,
            proofOutput,
            sender,
            _notary,
            expirationDateTime,
            lockHash,
            HoldStatusCode.Held,
            inputNoteHashes
        );
        emit NewHold(
            holdId,
            sender,
            inputNoteHashes,
            outputNoteHashes,
            _notary,
            expirationDateTime,
            lockHash
        );
    }

    function _validateProof(uint24 _proofId, bytes memory _proofData)
        internal
        returns (bytes memory proofOutput)
    {
        bytes memory validatedProofOutputs =
            ace.validateProof(_proofId, address(this), _proofData);
        proofOutput = validatedProofOutputs.get(0);
    }

    function _holdProofValidateNotes(
        bytes memory _proofOutput,
        address sender,
        address _notary
    )
        internal
        returns (
            bytes32[] memory inputNoteHashes,
            bytes32[] memory outputNoteHashes
        )
    {
        (bytes memory inputNotes, bytes memory outputNotes, , ) =
            _proofOutput.extractProofOutput();

        uint256 inputNotesCount = inputNotes.getLength();
        inputNoteHashes = new bytes32[](inputNotesCount);
        uint256 outputNotesCount = outputNotes.getLength();
        outputNoteHashes = new bytes32[](outputNotesCount);

        for (uint256 j = 0; j < inputNotesCount; j += 1) {
            (, bytes32 noteHash, ) = inputNotes.get(j).extractNote();
            (uint8 status, , , address noteOwner) =
                ace.getNote(address(this), noteHash);
            require(status == 1, "only unspent notes can be on hold");
            require(
                noteOwner == sender,
                "the note owner did not sign this proof"
            );
            require(heldNotes[noteHash] == false, "a note is already on hold");
            // TODO check the notary can view the note
            heldNotes[noteHash] = true;
            inputNoteHashes[j] = noteHash;
        }

        for (uint256 j = 0; j < outputNotesCount; j += 1) {
            (, bytes32 noteHash, ) = outputNotes.get(j).extractNote();
            outputNoteHashes[j] = noteHash;
        }

        bytes32 proofHash = keccak256(_proofOutput);
        confidentialApproved[proofHash][address(this)] = true;
    }

    function confidentialTransfer(
        uint24 _proofId,
        bytes memory _proofData,
        bytes memory _signatures
    ) public {
        bytes memory proofOutputs =
            ace.validateProof(_proofId, msg.sender, _proofData);
        for (uint256 i = 0; i < proofOutputs.getLength(); i += 1) {
            bytes memory proofOutput = proofOutputs.get(i);
            canTransfer(_proofId, proofOutput);
        }
        super.confidentialTransfer(_proofId, _proofData, _signatures);
    }

    function confidentialTransferFrom(
        uint24 _proofId,
        bytes memory _proofOutput
    ) public {
        canTransfer(_proofId, _proofOutput);
        super.confidentialTransferFrom(_proofId, _proofOutput);
    }

    // A special function to call the super confidentialTransferFrom function but
    // with msg.sender set to this contract
    function confidentialTransferFromExternalSuper(
        uint24 _proofId,
        bytes calldata _proofOutput
    ) external {
        require(
            msg.sender == address(this),
            "confidentialTransferFromExternalSuper: can only be called externally from this contract."
        );
        super.confidentialTransferFrom(_proofId, _proofOutput);
    }

    function canTransfer(uint24 _proof, bytes memory _proofOutput) internal {
        (
            bytes memory inputNotes,
            bytes memory outputNotes,
            address publicOwner,
            int256 publicValue
        ) = _proofOutput.extractProofOutput();

        // for each input note in the proof
        for (uint256 i = 0; i < inputNotes.getLength(); i += 1) {
            (address noteOwner, bytes32 noteHash, bytes memory noteMetadata) =
                inputNotes.get(i).extractNote();

            require(
                heldNotes[noteHash] == false,
                "confidentialTransfer: input note is on hold"
            );
        }
    }

    /**
     @notice Called by the notary to transfer the held tokens to the recipient if the is no hold lock hash.
     @param holdId a unique identifier for the hold.
     */
    function executeHold(bytes32 holdId) external isHeld(holdId) {
        require(
            holds[holdId].notary == msg.sender,
            "executeHold: caller must be the hold notary"
        );
        require(
            holds[holdId].lockHash.length != 0,
            "executeHold: need preimage if the hold has a lock hash"
        );

        // this. will make the msg.sender this contract as it's an external call
        this.confidentialTransferFromExternalSuper(
            holds[holdId].proofId,
            holds[holdId].proofOutput
        );

        holds[holdId].status = HoldStatusCode.Executed;

        emit ExecutedHold(holdId, holds[holdId].lockHash);
    }

    /**
     @notice Called by the notary to transfer the held tokens to the recipient.
     @param holdId a unique identifier for the hold.
     @param lockPreimage the image used to generate the lock hash with a keccak256 hash
     */
    function executeHold(bytes32 holdId, bytes32 lockPreimage)
        external
        isHeld(holdId)
    {
        require(
            holds[holdId].notary == msg.sender,
            "executeHold: caller must be the hold notary"
        );
        if (holds[holdId].lockHash.length > 0) {
            require(
                holds[holdId].lockHash ==
                    sha256(abi.encodePacked(lockPreimage)),
                "executeHold: preimage hash does not match lock hash"
            );
        }

        this.confidentialTransferFromExternalSuper(
            holds[holdId].proofId,
            holds[holdId].proofOutput
        );

        holds[holdId].status = HoldStatusCode.Executed;

        emit ExecutedHold(holdId, holds[holdId].lockHash);
    }

    /**
     @notice Called by the sender after the expiration date to release the held tokens so they have control of them again.
     @param holdId a unique identifier for the hold.
     */
    function releaseHold(bytes32 holdId, bytes calldata releaseSignature)
        external
        isHeld(holdId)
        replaySignature(releaseSignature)
    {
        bytes32 digest =
            keccak256(
                abi.encodePacked(
                    "\x19\x01",
                    DOMAIN_SEPARATOR,
                    keccak256(abi.encode(RELEASE_SIGNATURE_TYPE_HASH, holdId))
                )
            );

        // The sender of the notes is the account that signed the EIP712 Hold instruction, not the msg.sender
        address sender = recoverSignature(digest, releaseSignature);
        if (holds[holdId].sender == sender) {
            require(
                now > holds[holdId].expirationDateTime,
                "releaseHold: can only release after the expiration date."
            );
        } else if (holds[holdId].notary != sender) {
            revert("releaseHold: caller must be the hold sender or notary.");
        }

        // release the hold on the input notes
        for (uint256 i = 0; i < holds[holdId].inputNotesHashes.length; i++) {
            heldNotes[holds[holdId].inputNotesHashes[i]] = false;
        }

        holds[holdId].status = HoldStatusCode.Released;

        emit ReleaseHold(holdId);
    }

    /**
     @param holdId a unique identifier for the hold.
     @return hold status code.
     */
    function holdStatus(bytes32 holdId) external view returns (HoldStatusCode) {
        return holds[holdId].status;
    }
}
