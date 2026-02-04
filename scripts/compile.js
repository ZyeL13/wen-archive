const fs = require("fs");
const solc = require("solc");

const source = fs.readFileSync("contracts/WenArchive.sol", "utf8");

const input = {
  language: "Solidity",
  sources: {
    "WenArchive.sol": { content: source }
  },
  settings: {
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode"]
      }
    }
  }
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
  for (const e of output.errors) {
    console.error(e.formattedMessage);
  }
}

const contract = output.contracts["WenArchive.sol"]["WenArchive"];

fs.writeFileSync("WenArchive.abi.json", JSON.stringify(contract.abi, null, 2));
fs.writeFileSync("WenArchive.bytecode.txt", contract.evm.bytecode.object);

console.log("compiled successfully");
