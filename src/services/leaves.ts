import { EterLeaf } from "../models/leaves";
import { DEFAULT_RADIUS_METERS } from "../constants";
import { Point } from "geojson";
import algosdk from "algosdk";
import { AlgorandClient } from "@algorandfoundation/algokit-utils";
import { getAlgodConfigFromViteEnvironment } from "../utils/blockchain/getAlgoClientConfigs";

// Tipi per il servizio
interface CreateEterLeafRequest {
  title: string;
  content: string;
  longitude: number;
  latitude: number;
}

interface SubmitTransactionRequest {
  signedTransaction: number[];
  latitude: number;
  longitude: number;
  message: string;
}

interface GetNearbyRequest {
  longitude: string;
  latitude: string;
  radius?: number;
}

interface EterLeafResponse {
  id: number;
  title: string;
  content: string;
  location: Point;
  created_at: Date;
}

interface SubmitTransactionResponse {
  success: boolean;
  assetId?: number;
  transactionId?: string;
  error?: string;
}

// Esportiamo i tipi per l'uso nel controller
export type {
  SubmitTransactionRequest,
  GetNearbyRequest,
  EterLeafResponse,
  SubmitTransactionResponse,
};
export class EterLeafService {
  static async createEterLeaf(
    data: SubmitTransactionRequest
  ): Promise<SubmitTransactionResponse> {
    try {
      const { signedTransaction, latitude, longitude, message } = data;

      // Converti l'array di numeri in Uint8Array
      const signedTxnBytes = new Uint8Array(signedTransaction);

      // Ottieni la configurazione del client Algorand
      const algodConfig = getAlgodConfigFromViteEnvironment();
      const algorandClient = AlgorandClient.fromClients({
        algod: new algosdk.Algodv2(
          algodConfig.token as string,
          algodConfig.server,
          algodConfig.port
        ),
      });

      // Crea una transazione noop per formare il gruppo
      const suggestedParams = await algorandClient.client.algod
        .getTransactionParams()
        .do();

      // Ottieni l'indirizzo del signer dalla variabile d'ambiente
      const secretSignerMnemonic = process.env.SECRET_SIGNER;
      if (!secretSignerMnemonic) {
        throw new Error(
          "SECRET_SIGNER non configurato nelle variabili d'ambiente"
        );
      }

      const secretAccount = algosdk.mnemonicToSecretKey(secretSignerMnemonic);

      // Crea una transazione noop (payment di 0 algos a se stesso)
      const noopTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: secretAccount.addr,
        receiver: secretAccount.addr,
        amount: 0,
        suggestedParams,
      });

      // Decodifica la transazione firmata dall'utente
      const userTxn = algosdk.decodeSignedTransaction(signedTxnBytes);

      // Crea il gruppo di transazioni
      const txnGroup = [userTxn.txn, noopTxn];
      algosdk.assignGroupID(txnGroup);

      // Firma la transazione noop con il secret signer
      const signedNoopTxn = algosdk.signTransaction(noopTxn, secretAccount.sk);

      // La transazione dell'utente è già firmata, dobbiamo solo estrarre i byte
      if (!userTxn.sig) {
        throw new Error("Transazione dell'utente non firmata");
      }

      // Invia il gruppo di transazioni
      const groupTxnBytes = [signedTxnBytes, signedNoopTxn.blob];
      const txResponse = await algorandClient.client.algod
        .sendRawTransaction(groupTxnBytes)
        .do();
      const txId = txResponse.txid;

      // Aspetta la conferma
      const confirmedTxn = await algosdk.waitForConfirmation(
        algorandClient.client.algod,
        txId,
        4
      );

      console.log("Transazione confermata:", {
        txId,
        round: confirmedTxn.confirmedRound,
        applicationIndex: confirmedTxn.applicationIndex,
        globalStateDelta: confirmedTxn.globalStateDelta,
        innerTxns: confirmedTxn.innerTxns?.length,
        logs: confirmedTxn.logs?.length,
      });

      // Estrai l'asset ID dal log della transazione
      let assetId: number | undefined;

      // Cerca nei log della transazione confermata
      const logs = confirmedTxn.logs || [];
      console.log("Logs trovati:", logs.length);

      for (const log of logs) {
        try {
          // I log di Algorand sono già in formato Uint8Array
          const logBuffer = log as Uint8Array;
          console.log("Analizzando log di lunghezza:", logBuffer.length);

          // Il log dell'evento EterLeafCreated contiene l'asset ID
          if (logBuffer.length >= 4) {
            // Salta i primi 4 byte (method selector) e leggi l'asset ID
            const assetIdBuffer = logBuffer.slice(4);
            console.log("Asset ID buffer lunghezza:", assetIdBuffer.length);

            // Assicurati che ci siano abbastanza byte per una BigInt (almeno 1 byte)
            if (assetIdBuffer.length >= 8) {
              // BigInt richiede almeno 8 byte per uint64
              assetId = Number(algosdk.bytesToBigInt(assetIdBuffer));
              console.log("Asset ID estratto:", assetId);
              break; // Esci dal loop una volta trovato l'asset ID
            } else if (assetIdBuffer.length > 0) {
              // Se abbiamo meno di 8 byte, prova a interpretare come numero più piccolo
              let value = 0;
              for (let i = 0; i < assetIdBuffer.length; i++) {
                value = (value << 8) | assetIdBuffer[i];
              }
              assetId = value;
              console.log("Asset ID estratto (formato ridotto):", assetId);
              break;
            }
          }
        } catch (e) {
          console.error("Errore durante il parsing del log:", e);
          // Ignora errori di parsing dei log
        }
      }

      // Se non abbiamo trovato l'asset ID nei log principali,
      // controlla le transazioni interne (inner transactions)
      if (assetId === undefined && confirmedTxn.innerTxns) {
        console.log("Controllando transazioni interne...");
        for (const innerTxn of confirmedTxn.innerTxns) {
          // Forza il cast a any per accedere alle proprietà dinamiche
          const txn = innerTxn as any;
          if (
            txn["created-asset-index"] ||
            txn.createdAssetIndex ||
            txn["asset-index"]
          ) {
            assetId =
              txn["created-asset-index"] ||
              txn.createdAssetIndex ||
              txn["asset-index"];
            console.log("Asset ID trovato nelle transazioni interne:", assetId);
            break;
          }
        }
      }

      // Non salviamo più nel database - la logica blockchain è sufficiente
      return {
        success: true,
        assetId: assetId,
        transactionId: txId,
      };
    } catch (error) {
      console.error("Errore in createEterLeaf:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Errore sconosciuto",
      };
    }
  }

  static async getAllEterLeaves(): Promise<EterLeafResponse[]> {
    const spots = await EterLeaf.selectWithLocation();
    return spots;
  }

  static async getNearbyEterLeaves(
    params: GetNearbyRequest
  ): Promise<EterLeafResponse[]> {
    const { longitude, latitude, radius = DEFAULT_RADIUS_METERS } = params;

    const spots = await EterLeaf.findNearby(
      parseFloat(longitude),
      parseFloat(latitude),
      radius
    );
    return spots;
  }
}
