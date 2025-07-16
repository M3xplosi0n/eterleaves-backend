import { AlgoClientConfig } from "@algorandfoundation/algokit-utils/types/network-client";
import type { TokenHeader } from "algosdk/dist/types/client/urlTokenBaseHTTPClient";

interface AlgoViteClientConfig extends AlgoClientConfig {
  /** Base URL of the server e.g. http://localhost, https://testnet-api.algonode.cloud/, etc. */
  server: string;
  /** The port to use e.g. 4001, 443, etc. */
  port: string | number;
  /** The token to use for API authentication (or undefined if none needed) - can be a string, or an object with the header key => value */
  token: string | TokenHeader;
  /** String representing current Algorand Network type (testnet/mainnet and etc) */
  network: string;
}

export function getAlgodConfigFromViteEnvironment(): AlgoViteClientConfig {
  if (!process.env.ALGOD_SERVER) {
    throw new Error(
      "Attempt to get default algod configuration without specifying ALGOD_SERVER in the environment variables"
    );
  }

  return {
    server: process.env.ALGOD_SERVER,
    port: process.env.ALGOD_PORT || "",
    token: process.env.ALGOD_TOKEN || "",
    network: process.env.ALGOD_NETWORK || "",
  };
}

export function getIndexerConfigFromViteEnvironment(): AlgoViteClientConfig {
  if (!process.env.INDEXER_SERVER) {
    throw new Error(
      "Attempt to get default algod configuration without specifying INDEXER_SERVER in the environment variables"
    );
  }

  return {
    server: process.env.INDEXER_SERVER,
    port: process.env.INDEXER_PORT || "",
    token: process.env.INDEXER_TOKEN || "",
    network: process.env.ALGOD_NETWORK || "",
  };
}
