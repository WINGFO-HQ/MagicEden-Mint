import inquirer from "inquirer";
import chalk from "chalk";
import { ethers } from "ethers";
import { blockchain, nft, helpers } from "./api/index.js";
import { ENV, loadWallets } from "./config/env.chain.js";
import { ABI } from "./config/ABI.js";
import MONAD_TESTNET from "./config/chain.js";

let globalMintVariant = "twoParams";

const getCustomPrompt = (message, choices) => ({
  type: "list",
  message: message,
  choices: choices.map((choice, i) => ({
    name: i === 0 ? chalk.cyan(`> ${choice}`) : `  ${choice}`,
    value: choice,
  })),
  prefix: "?",
});

const displayBanner = () => {
  console.log(chalk.blue("\n┌─────────────────────────────────┐"));
  console.log(
    chalk.blue("│") +
      chalk.white("         MONAD NFT MINTER        ") +
      chalk.blue("│")
  );
  console.log(
    chalk.blue("│") +
      chalk.gray("    Mint NFTs on Monad Chain     ") +
      chalk.blue("│")
  );
  console.log(
    chalk.blue("│") +
      chalk.cyan("     https://t.me/infomindao     ") +
      chalk.blue("│")
  );
  console.log(chalk.blue("└─────────────────────────────────┘\n"));
};

async function main() {
  displayBanner();

  const wallets = loadWallets();
  if (wallets.length === 0) {
    return;
  }

  const wallet = wallets[0];
  const provider = blockchain.createProvider(ENV.NETWORK);
  const mintOptions = await inquirer.prompt({
    type: "list",
    name: "mintOption",
    message: "Minting Mode:",
    choices: ["Instant Mint", "Scheduled Mint"],
    prefix: "?",
  });

  const contractAddressInput = await inquirer.prompt({
    type: "input",
    name: "contractAddress",
    message: "NFT Contract Address:",
    validate: (input) =>
      ethers.utils.isAddress(input) || "Please enter a valid address",
    prefix: "?",
  });

  try {
    const { name, symbol } = await nft.getCollectionInfo(
      contractAddressInput.contractAddress,
      provider
    );
    if (name !== "Unknown") {
      helpers.log.info(
        `Collection: ${name} ${symbol !== "Unknown" ? `(${symbol})` : ""}`
      );
    }
  } catch (error) {}

  const useContractPriceInput = await inquirer.prompt({
    type: "confirm",
    name: "useContractPrice",
    message: "Get price from contract?",
    default: true,
    prefix: "?",
  });

  let finalConfig = null;
  let derivedVariant = "twoParams";
  let zeroPrice = false;

  if (useContractPriceInput.useContractPrice) {
    try {
      const contractForConfig = blockchain.createContract(
        contractAddressInput.contractAddress,
        ABI,
        provider
      );
      const cfgResult = await nft.getConfigWithFallback(contractForConfig);
      if (cfgResult) {
        finalConfig = cfgResult.config;
        derivedVariant = cfgResult.variant;
        zeroPrice = !!cfgResult.zeroPrice;
      }
    } catch (err) {
      helpers.log.error("Error retrieving config from contract");
    }
  } else {
    helpers.log.warning("Manual price input requested");
  }

  let mintPrice;
  if (finalConfig && !zeroPrice && !finalConfig.publicStage.price.eq(0)) {
    mintPrice = finalConfig.publicStage.price;
    globalMintVariant = derivedVariant;

    const ethPrice = ethers.utils.formatEther(mintPrice);
    helpers.log.success(
      `Price obtained from contract - [${ethPrice} ${MONAD_TESTNET.SYMBOL}]`
    );

    if (finalConfig.maxSupply) {
      helpers.log.info(`Supply: ${finalConfig.maxSupply.toString()}`);
    }
  } else {
    helpers.log.error("Unable to retrieve Price from contract");
    const { manualPrice } = await inquirer.prompt({
      type: "input",
      name: "manualPrice",
      message: "MINT_PRICE:",
      validate: (input) => !isNaN(input) && Number(input) > 0,
      prefix: "?",
    });

    mintPrice = ethers.utils.parseEther(manualPrice.toString());
    globalMintVariant = "twoParams";

    helpers.log.info(
      `Price is set to [${manualPrice} ${MONAD_TESTNET.SYMBOL}]`
    );
  }

  if (
    mintOptions.mintOption === "Scheduled Mint" &&
    finalConfig &&
    !finalConfig.publicStage.price.eq(0)
  ) {
    try {
      const startTime = finalConfig.publicStage.startTime.toNumber();
      const currentTime = Math.floor(Date.now() / 1000);
      if (currentTime < startTime) {
        helpers.log.warning("Scheduling Mint...");
        helpers.log.info(
          `Mint scheduled for [${blockchain.formatUnixTimestamp(startTime)}]`
        );

        const interval = setInterval(() => {
          const timeRemaining = helpers.getTimeRemaining(startTime);
          if (timeRemaining.totalSeconds <= 0) {
            clearInterval(interval);
            helpers.log.success("Starting mint now!");
          } else {
            process.stdout.write(
              `\r! Time remaining: ${timeRemaining.formatted}`
            );
          }
        }, 1000);

        await helpers.sleep((startTime - currentTime) * 1000);
        clearInterval(interval);
        console.log("\n");
      }
    } catch (err) {
      helpers.log.error(`Error scheduling startTime: ${err.message}`);
    }
  }

  const latestBlock = await provider.getBlock("latest");
  const baseFee = latestBlock.baseFeePerGas;
  const fee = baseFee.mul(125).div(100);

  const gasLimit = blockchain.getRandomGasLimit(
    ENV.DEFAULT_GAS_LIMIT_MIN,
    ENV.DEFAULT_GAS_LIMIT_MAX
  );

  helpers.log.info(
    `Using gasLimit: [${gasLimit}] globalMintVariant: [${globalMintVariant}]`
  );

  const explorerUrl = MONAD_TESTNET.TX_EXPLORER;

  try {
    const result = await nft.executeMint(
      contractAddressInput.contractAddress,
      blockchain.createWallet(wallet.privateKey, provider),
      gasLimit,
      fee,
      globalMintVariant,
      mintPrice,
      explorerUrl
    );

    if (
      result &&
      result.successVariant &&
      result.successVariant !== globalMintVariant
    ) {
      helpers.log.warning(`Updated mint method to: ${result.successVariant}`);
      globalMintVariant = result.successVariant;
    }
  } catch (err) {
    helpers.log.error(`Execution error: ${err.message}`);
    process.exit(1);
  }

  helpers.log.success("Minting process completed!");
}

main().catch((err) => {
  helpers.log.error(`Execution error: ${err.message}`);
  process.exit(1);
});
