import { Contract, Bytes, bytes, uint64, assert, GlobalState, Txn, op, emit, abimethod } from "@algorandfoundation/algorand-typescript";
import { validateCoordinates, createAndTransferNFT } from "./utils.algo";

export class EterLeaves extends Contract {
  // Global state to track the number of created NFTs
  totalSpots = GlobalState<uint64>({ initialValue: 0 });

  /**
   * Creates a new Eter Leaf NFT
   * @param latOffset Latitude with offset (real_value + 90) * 1000000
   * @param longOffset Longitude with offset (real_value + 180) * 1000000
   * @param message Message associated with the Eter Leaf
   * @returns ID of the created asset
   */
  createEterLeaf(latOffset: uint64, longOffset: uint64, message: string): uint64 {
    // Validate coordinates
    const isValid = validateCoordinates(latOffset, longOffset);
    assert(isValid === 1, "Invalid coordinates");

    // Increment the eter leaf counter
    const spotId = this.totalSpots.value;
    this.totalSpots.value += 1;

    // Create metadata
    const metadata = this.createMetadata(latOffset, longOffset, message);

    // Create asset name, unit name and URL specific to Eter Leaves
    const spotIdBytes = op.itob(spotId);
    const assetName = op.concat(Bytes("Eter Leaf #"), spotIdBytes);
    const unitName = Bytes("ELEAF");
    const url = op.concat(Bytes("ipfs://eter_leaf_metadata_"), spotIdBytes);

    // Use the generic function to create and transfer the NFT
    const assetId = createAndTransferNFT(metadata, assetName, unitName, url, Txn.sender);

    // Emit an event for Eter Leaf creation
    emit("EterLeafCreated", assetId);

    return assetId;
  }

  /**
   * Creates a new Eter Leaf NFT
   * @param latOffset Latitude with offset (real_value + 90) * 1000000
   * @param longOffset Longitude with offset (real_value + 180) * 1000000
   * @param message Message associated with the Eter Leaf
   * @returns ID of the created asset
   */
  private createMetadata(latOffset: uint64, longOffset: uint64, message: string): bytes {
    // Convert uint64 to bytes
    const latBytes = op.itob(latOffset);
    const longBytes = op.itob(longOffset);
    const msgBytes = Bytes(message);

    // Create strings for metadata
    const latStr = op.concat(Bytes("lat:"), latBytes);
    const longStr = op.concat(Bytes(",long:"), longBytes);
    const msgStr = op.concat(Bytes(",msg:"), msgBytes);

    // Concatenate all parts
    let metadata = op.concat(latStr, longStr);
    metadata = op.concat(metadata, msgStr);

    return metadata;
  }

  /**
   * Get the total number of Eter Leaves created
   */
  @abimethod({ readonly: true })
  public getTotalSpotsTest(): uint64 {
    return this.totalSpots.value;
  }
}
