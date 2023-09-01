const hre = require("hardhat");

async function main() {
  const demoContract = await hre.ethers.deployContract("PADODemo");
  await demoContract.waitForDeployment();
  console.log(`demoContract deployed to ${demoContract.target}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
