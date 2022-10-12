pragma solidity >= 0.5.0 <0.9.0;

import 'ERC1400/contracts/tokens/ERC20Token.sol';

/**
 * @title CodefiERC20 contract
 */
contract CodefiERC20 is ERC20Token {
    event CodefiERC20Deployed(string name, string symbol, uint8 decimals);

    /**
    * @dev Deploys a token and emit an event
    * @param _name token name
    * @param _symbol token symbol
    * @param _decimals token decimals
    */
  constructor(string memory _name, string memory _symbol, uint8 _decimals) public ERC20Token(_name, _symbol, _decimals) {
    emit CodefiERC20Deployed(_name, _symbol, _decimals);
  }

  function burn(uint256 amount) public override onlyOwner {
    super.burn(amount);
  }

  /**
   * @dev Destroys `amount` tokens from `account`, deducting from the caller's
   * allowance.
   *
   * See {ERC20-_burn} and {ERC20-allowance}.
   *
   * Requirements:
   *
   * - the caller must have allowance for ``accounts``'s tokens of at least
   * `amount`.
   */
  function burnFrom(address account, uint256 amount) public override {
    revert('burnFrom is not supported');
  }
}
