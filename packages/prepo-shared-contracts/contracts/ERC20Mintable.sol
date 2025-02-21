// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./SafeOwnable.sol";

//TODO: add tests and interface for this
contract ERC20Mintable is ERC20, SafeOwnable {
  constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

  function mint(address recipient, uint256 amount) external onlyOwner {
    _mint(recipient, amount);
  }
}
