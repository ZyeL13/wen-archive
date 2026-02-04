require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");

const abi = JSON.parse(fs.readFileSync("WenArchive.abi.json"));
const bytecode = fs.readFileSync("WenArchive.bytecode.txt", "utf8");

const provider = new ethers.JsonRpcProvider(
  "https://sepolia.base.org"
);

const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

async function main() {
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  console.log("WenArchive deployed to:", contract.target);
}

main();
