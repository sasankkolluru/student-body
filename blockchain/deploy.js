const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying Voting contract...");
  
  // Get the contract factory
  const Voting = await ethers.getContractFactory("Voting");
  
  // Deploy the contract
  const voting = await Voting.deploy();
  await voting.deployed();
  
  console.log("Voting contract deployed to:", voting.address);
  
  // Save the contract address to a file
  const configPath = path.join(__dirname, "..", "src", "config", "contracts.json");
  const config = {
    votingContract: voting.address,
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId
  };
  
  // Create config directory if it doesn't exist
  if (!fs.existsSync(path.dirname(configPath))) {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
  }
  
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log("Contract configuration saved to:", configPath);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
