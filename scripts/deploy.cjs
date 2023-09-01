const hre = require("hardhat");

async function main() {
  const easAddr = "0xC2679fBD37d54388Ce493F1DB75320D236e1815e";
  const PADOAddr = "0xe02bD7a6c8aA401189AEBb5Bad755c2610940A73";
  const PADOSchema = "0xe4c12be3c85cada725c600c1f2cde81d7cc15f957537e5756742acc3f5859084";
  console.log("deploy......");
  const demoContract = await hre.ethers.deployContract("PADODemo", [easAddr, PADOAddr, PADOSchema]);
  await demoContract.waitForDeployment();
  console.log(`demoContract deployed to ${demoContract.target}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
