import { ethers } from 'hardhat'
import { DepositTradeHelper } from '../../types/generated'

export async function depositTradeHelperFixture(
  collateral: string,
  swapRouter: string
): Promise<DepositTradeHelper> {
  const factory = await ethers.getContractFactory('DepositTradeHelper')
  return (await factory.deploy(collateral, swapRouter)) as DepositTradeHelper
}
