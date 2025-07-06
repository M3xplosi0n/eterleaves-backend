# 🌿 EterLeaves – Smart Contracts

**EterLeaves** is a Web3 application built on Algorand that serves as an eternal diary of human emotions. This repository contains the smart contracts of the project, developed with Algorand TypeScript and the AlgoKit ecosystem for managing emotions on the blockchain.

---

## 🚀 Tech Stack

- **Algorand TypeScript** - Typed language for smart contracts
- **AlgoKit CLI** - Algorand development toolkit
- **AlgoKit Utils** - Algorand utilities
- **Docker** - For LocalNet
- **Puya Compiler** - Compiler for Algorand TypeScript
- **TypeScript** - Typed programming language
- **NPM** - Package and dependency management

---

## ⚙️ Setup

### 📋 Prerequisites

- **Node.js** >= 22
- **AlgoKit CLI** >= 2.5
- **Docker** (required only for LocalNet)
- **Puya Compiler** >= 4.4.4

To install AlgoKit:

```bash
npm install -g algokit
```

> For an interactive tour of the codebase, download the [vsls-contrib.codetour](https://marketplace.visualstudio.com/items?itemName=vsls-contrib.codetour) extension for VS Code, then open the [`.codetour.json`](./.tours/getting-started-with-your-algokit-project.tour) file in the code tour extension.

### 🚀 Initial Setup

#### 1. Clone the Repository

Start by cloning this repository to your local machine.

#### 2. Install Prerequisites

Ensure the following prerequisites are installed and properly configured:

- **Docker**: Required for running a local Algorand network.
- **AlgoKit CLI**: Essential for project setup and operations. Verify installation with `algokit --version`, expecting version `2.6.0` or later.

#### 3. Bootstrap Your Local Environment

Run the following commands within the project folder:

- **Setup Project**: Execute `algokit project bootstrap all` to install dependencies and setup npm dependencies.
- **Configure environment**: Execute `algokit generate env-file -a target_network localnet` to create a `.env.localnet` file with default configuration for `localnet`.
- **Start LocalNet**: Use `algokit localnet start` to initiate a local Algorand network.

---

## 🛠️ Development Workflow

### 💻 Terminal

Directly manage and interact with your project using AlgoKit commands:

1. **Build Contracts**: `algokit project run build` compiles all smart contracts. You can also specify a specific contract by passing the name of the contract folder as an extra argument.
   For example: `algokit project run build -- hello_world` will only build the `hello_world` contract.

2. **Deploy**: Use `algokit project deploy localnet` to deploy contracts to the local network. You can also specify a specific contract by passing the name of the contract folder as an extra argument.
   For example: `algokit project deploy localnet -- hello_world` will only deploy the `hello_world` contract.

| Command                           | Description                   |
| --------------------------------- | ----------------------------- |
| `algokit project run build`       | Compile all smart contracts   |
| `algokit project deploy localnet` | Deploy to LocalNet            |
| `algokit project deploy testnet`  | Deploy to TestNet             |
| `algokit project deploy mainnet`  | Deploy to MainNet             |
| `algokit localnet start`          | Start LocalNet                |
| `algokit localnet stop`           | Stop LocalNet                 |
| `algokit generate smart-contract` | Generate a new smart contract |

### 🔧 VS Code

For a seamless experience with breakpoint debugging and other features:

1. **Open Project**: In VS Code, open the repository root.
2. **Install Extensions**: Follow prompts to install recommended extensions.
3. **Debugging**: Use `F5` to start debugging.

### 🧠 JetBrains IDEs

While primarily optimized for VS Code, JetBrains IDEs are also supported:

1. **Open Project**: In your JetBrains IDE, open the repository root.
2. **Automatic Setup**: The IDE should automatically configure the Node.js environment.
3. **Debugging**: Use `Shift+F10` or `Ctrl+R` to start debugging.

> **Note**: Windows users may encounter issues with pre-launch tasks due to a known bug. See [JetBrains forums](https://youtrack.jetbrains.com/issue/IDEA-277486/Shell-script-configuration-cannot-run-as-before-launch-task) for workarounds.

---

## 🏗️ AlgoKit Project Management

This project supports both standalone and monorepo setups through AlgoKit workspaces. Leverage [`algokit project run`](https://github.com/algorandfoundation/algokit-cli/blob/main/docs/features/project/run.md) commands for efficient monorepo project orchestration and management across multiple projects within a workspace.

---

## 🎯 AlgoKit Generators

This template provides a set of [AlgoKit generators](https://github.com/algorandfoundation/algokit-cli/blob/main/docs/features/generate.md) that allow you to further modify the project instantiated from the template to fit your needs, as well as giving you a base to build your own extensions to invoke via the `algokit generate` command.

### 📄 Generate Smart Contract

By default the template creates a single `HelloWorld` contract under the eterleaves folder in the `smart_contracts` directory. To add a new contract:

1. From the root of the project (`../`) execute `algokit generate smart-contract`. This will create a new starter smart contract and deployment configuration file under `{your_contract_name}` subfolder in the `smart_contracts` directory.

2. Each contract potentially has different creation parameters and deployment steps. Hence, you need to define your deployment logic in `deploy-config.ts` file.

3. Technically, you need to reference your contract deployment logic in the `index.ts` file. However, by default, `index.ts` will auto import all TypeScript deployment files under `smart_contracts` directory. If you want to manually import specific contracts, modify the default code provided by the template in `index.ts` file.

> Please note, above is just a suggested convention tailored for the base configuration and structure of this template. The default code supplied by the template in the `index.ts` file is tailored for the suggested convention. You are free to modify the structure and naming conventions as you see fit.

### 📝 Generate '.env' files

By default the template instance does not contain any env files to deploy to different networks. Using [`algokit project deploy`](https://github.com/algorandfoundation/algokit-cli/blob/main/docs/features/project/deploy.md) against `localnet` | `testnet` | `mainnet` will use default values for `algod` and `indexer` unless overwritten via `.env` or `.env.{target_network}`.

To generate a new `.env` or `.env.{target_network}` file, run `algokit generate env-file`

### 🐛 Debugging Smart Contracts

This project is optimized to work with AlgoKit AVM Debugger extension. To activate it:

Refer to the commented header in the `index.ts` file in the `smart_contracts` folder. Since you have opted in to include VSCode launch configurations in your project, you can also use the `Debug TEAL via AlgoKit AVM Debugger` launch configuration to interactively select an available trace file and launch the debug session for your smart contract.

For information on using and setting up the `AlgoKit AVM Debugger` VSCode extension refer [here](https://github.com/algorandfoundation/algokit-avm-vscode-debugger). To install the extension from the VSCode Marketplace, use the following link: [AlgoKit AVM Debugger extension](https://marketplace.visualstudio.com/items?itemName=algorandfoundation.algokit-avm-vscode-debugger).

---

## 🛠️ Tools and Technologies

This project makes use of Algorand TypeScript to build Algorand smart contracts. The following tools are in use:

- **[Algorand](https://www.algorand.com/)** - Layer 1 Blockchain; [Developer portal](https://dev.algorand.co/), [Why Algorand?](https://dev.algorand.co/getting-started/why-algorand/)
- **[AlgoKit](https://github.com/algorandfoundation/algokit-cli)** - One-stop shop tool for developers building on the Algorand network; [docs](https://github.com/algorandfoundation/algokit-cli/blob/main/docs/algokit.md), [intro tutorial](https://github.com/algorandfoundation/algokit-cli/blob/main/docs/tutorials/intro.md)
- **[Algorand TypeScript](https://github.com/algorandfoundation/puya-ts/)** - A semantically and syntactically compatible, typed TypeScript language that works with standard TypeScript tooling and allows you to express smart contracts (apps) and smart signatures (logic signatures) for deployment on the Algorand Virtual Machine (AVM); [docs](https://github.com/algorandfoundation/puya-ts/), [examples](https://github.com/algorandfoundation/puya-ts/tree/main/examples)
- **[AlgoKit Utils](https://github.com/algorandfoundation/algokit-utils-ts)** - A set of core Algorand utilities that make it easier to build solutions on Algorand
- **[NPM](https://www.npmjs.com/)** - TypeScript packaging and dependency management
- **[TypeScript](https://www.typescriptlang.org/)** - Strongly typed programming language that builds on JavaScript
- **[ts-node-dev](https://github.com/wclr/ts-node-dev)** - TypeScript development execution environment

### 💻 VS Code

It has also been configured to have a productive dev experience out of the box in [VS Code](https://code.visualstudio.com/), see the [.vscode](./.vscode) folder.

---

## 🚀 Next Steps

1. **Explore existing smart contracts** in the `smart_contracts/` folder
2. **Create new contracts** using `algokit generate smart-contract`
3. **Test your contracts** on LocalNet before deployment
4. **Integrate with frontend** through automatically generated TypeScript clients
5. **Deploy to TestNet** for more realistic testing
6. **Prepare for MainNet** when the application is ready for production

---

_Part of the EterLeaves project - An eternal diary of human emotions on the Algorand blockchain_ 🌿
