pragma solidity >= 0.5.0 <0.9.0;

import 'ERC1400/contracts/tokens/ERC721Token.sol';

/**
 * @title CodefiERC721 contract
 */
contract CodefiERC721 is ERC721Token {
    event CodefiERC721Deployed(string name, string symbol);

    /**
    * @dev Deploys a token and emit an event
    * @param _name token name
    * @param _symbol token symbol
    */
  constructor(string memory _name, string memory _symbol) public ERC721Token(_name, _symbol, "") {
    emit CodefiERC721Deployed(_name, _symbol);
  }
}
