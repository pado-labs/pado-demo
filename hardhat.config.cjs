require("@nomicfoundation/hardhat-toolbox");

const Private_Key = "xxx"; //private key

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19",
  networks: {
    sepolia: {
        url: `https://sepolia.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8`,
        accounts: [`${Private_Key}`]
    }
  }
};
