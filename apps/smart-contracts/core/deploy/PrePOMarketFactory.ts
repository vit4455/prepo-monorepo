// eslint-disable no-console
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { ContractAddressOrInstance } from '@openzeppelin/hardhat-upgrades/dist/utils'
import { utils } from 'prepo-hardhat'
import { ChainId } from 'prepo-constants'
import { fetchExistingCollateral, sendTxAndWait } from '../helpers'
import { PrePOMarketFactory } from '../typechain'

const { assertIsTestnetChain, recordDeployment } = utils

const deployFunction: DeployFunction = async function ({
  getNamedAccounts,
  ethers,
  upgrades,
  getChainId,
}: HardhatRuntimeEnvironment) {
  const { deployer } = await getNamedAccounts()
  console.log('Running PrePOMarketFactory deployment script with', deployer, 'as the deployer')
  const currentChain = await getChainId()
  /**
   * Make sure this script is not accidentally targeted towards a production environment.
   * This can be temporarily removed if deploying to prod.
   */
  assertIsTestnetChain(currentChain as unknown as ChainId)
  // Fetch existing Collateral deployment from local .env
  const collateral = await fetchExistingCollateral(currentChain, ethers)
  /**
   * Attempt to retrieve existing PrePOMarketFactory deployment to attempt an upgrade, or
   * deploy a new instance if one doesn't exist.
   *
   * Similarly with the Collateral contract, we currently use environment variables to
   * detect an existing deployment.
   */
  let prePOMarketFactory: PrePOMarketFactory
  const envVarName = `PREPO_MARKET_FACTORY_${currentChain}`
  const existingPrePOMarketFactoryAddress = process.env[envVarName]
  const PrePOMarketFactoryFactory = await ethers.getContractFactory('PrePOMarketFactory')
  if (!existingPrePOMarketFactoryAddress) {
    prePOMarketFactory = (await upgrades.deployProxy(
      PrePOMarketFactoryFactory,
      []
    )) as PrePOMarketFactory
    await prePOMarketFactory.deployed()
    console.log('Deployed PrePOMarketFactory to', prePOMarketFactory.address)
    // Record PrePOMarketFactory deployment in local .env file
    recordDeployment(envVarName, prePOMarketFactory)
  } else {
    prePOMarketFactory = (await upgrades.upgradeProxy(
      existingPrePOMarketFactoryAddress as ContractAddressOrInstance,
      PrePOMarketFactoryFactory
    )) as PrePOMarketFactory
    console.log('Upgraded PrePOMarketFactory at', prePOMarketFactory.address)
  }
  if (!(await prePOMarketFactory.isValidCollateral(collateral.address))) {
    console.log(
      'Configuring PrePOMarketFactory to set Collateral at',
      collateral.address,
      'as valid collateral...'
    )
    await sendTxAndWait(await prePOMarketFactory.setCollateralValidity(collateral.address, true))
  }
  console.log('')
}

export default deployFunction

deployFunction.dependencies = ['Collateral']

deployFunction.tags = ['PrePOMarketFactory']
