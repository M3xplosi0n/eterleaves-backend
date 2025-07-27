import {
  uint64,
  bytes,
  Global,
  Txn,
  itxn,
  Account,
} from "@algorandfoundation/algorand-typescript";

// Constants for coordinate validation
export const MAX_LAT_VALUE: uint64 = 180000000; // 90 * 1000000 * 2
export const MAX_LONG_VALUE: uint64 = 360000000; // 180 * 1000000 * 2

/**
 * Validates that coordinates are within correct ranges
 * @param latOffset Latitude with offset (real_value + 90) * 1000000
 * @param longOffset Longitude with offset (real_value + 180) * 1000000
 * @returns 1 if valid, 0 if not valid
 */
export function validateCoordinates(
  latOffset: uint64,
  longOffset: uint64
): uint64 {
  // Verify that latitude is between 0 and 180000000 (representing -90 to +90 with 6 decimals)
  const latValid = latOffset <= MAX_LAT_VALUE;

  // Verify that longitude is between 0 and 360000000 (representing -180 to +180 with 6 decimals)
  const longValid = longOffset <= MAX_LONG_VALUE;

  // Combine validations
  return latValid && longValid ? 1 : 0;
}

/**
 * Generic function to create and transfer an NFT
 * @param metadata Metadata to include in the NFT
 * @param assetName Name of the asset
 * @param unitName Unit name of the asset
 * @param url URL for the asset metadata
 * @param receiver Address to receive the NFT (defaults to transaction sender)
 * @returns ID of the created asset
 */
export function createAndTransferNFT(
  metadata: bytes,
  assetName: bytes,
  unitName: bytes,
  url: bytes,
  receiver: Account
): uint64 {
  // Create the NFT as an Algorand asset
  const itxnResult = itxn
    .assetConfig({
      total: 1,
      decimals: 0,
      unitName: unitName,
      assetName: assetName,
      url: url,
      note: metadata,
      manager: Global.currentApplicationAddress,
      reserve: Global.currentApplicationAddress,
      freeze: Global.currentApplicationAddress,
      clawback: Global.currentApplicationAddress,
    })
    .submit();

  const assetId = itxnResult.createdAsset.id;

  // Transfer the NFT to the specified receiver
  itxn
    .assetTransfer({
      xferAsset: assetId,
      assetAmount: 1,
      assetReceiver: receiver,
    })
    .submit();

  return assetId;
}
