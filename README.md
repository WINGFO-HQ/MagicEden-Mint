# Monad NFT Minter

A modular, command-line tool for minting NFTs on the Monad blockchain. Simplifies the process of interacting with NFT contracts by automatically detecting the correct mint function and parameters.

## Features

- **Modular Architecture**: Clean separation of concerns for easy maintenance and extensions
- **Multiple Minting Modes**: Choose between Instant or Scheduled minting
- **Smart Contract Integration**: Automatic detection of the correct mint function and parameters
- **Auto Price Detection**: Automatically retrieves mint price from contracts
- **Scheduled Minting**: Automatically start minting at the contract's specified launch time
- **Simple Wallet Management**: Easy configuration through environment variables
- **Collection Details**: Displays collection name and supply information when available

## Installation

1. Clone the repository:

```bash
git clone https://github.com/WINGFO-HQ/MagicEden-Mint.git
cd MagicEden-Mint
```

2. Install dependencies:

```bash
npm install
```

3. Configure your wallet:

   Add your private key to the `.env` file:

   ```
   NETWORK=monad-testnet
   MAX_CONCURRENT_MINTS=10
   DEFAULT_GAS_LIMIT_MIN=180000
   DEFAULT_GAS_LIMIT_MAX=280000

   PRIVATEKEY=0xYourPrivateKeyHere
   ```

   ⚠️ **IMPORTANT**: Never share your `.env` file or expose your private keys.

## Usage

Start the minting tool:

```bash
#Setup .env
npm run setup

#Start
npm start
```

Follow the interactive prompts to:

1. Choose between Instant Mint or Scheduled Mint
2. Enter the NFT contract address
3. Choose to retrieve the mint price from the contract or enter manually

### Example

```
┌──────────────────────────────────────┐
│           MONAD NFT MINTER           │
│       Mint NFTs on Monad Chain       │
│        https://t.me/infomindao       │
└──────────────────────────────────────┘

> Loaded 1 wallet from environment variables
? Minting Mode: Instant Mint
? NFT Contract Address: 0x000000
> Collection: MyNFTCollection (MNFT)
? Get price from contract? Yes
+ Price obtained from contract - [0.0001 MON]
> Supply: 999999
> Using gasLimit: [267348] globalMintVariant: [fourParams]
> Wallet is minting 1 NFT(s)
+ Mint transaction sent! [0x0000...0000]
  https://testnet.monadexplorer.com/tx/0x0000000000000000
+ Transaction confirmed in Block [6290517]
+ Minting process completed!
```

## Project Structure

```
|— api/
|   |— core/           # Core components for network requests
|   |   |— blockchain.js # Blockchain interaction utilities
|   |   |— http.js     # HTTP client for API requests
|   |— services/       # API services like wallet, collection, etc.
|   |   |— magiceden.js # Magic Eden API integration
|   |   |— nft.js      # NFT contract interactions
|   |— utils/          # Helper utilities for API
|   |   |— helpers.js  # General helper functions
|   |— index.js        # API entry point
|— config/
|   |— ABI.js          # Contract ABI definitions
|   |— chain.js        # Blockchain configuration
|   |— env.chain.js    # Blockchain environment variables
|— .env                # API & wallet configuration
|— main.js             # Application entry point
```

## Supported Networks

Currently supports Monad Testnet.

## Community

Join our Telegram community for updates, support, and discussions:

- [Telegram](https://t.me/infomindao)

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
