import {
  Contract,
  contract,
  abimethod,
  compile,
  Global,
  Txn,
  itxn,
  uint64,
  BoxMap,
  Asset,
  OnCompleteAction,
  Account,
  Uint64,
  gtxn,
  assert,
} from "@algorandfoundation/algorand-typescript";

import {
  Address,
  methodSelector,
  interpretAsArc4,
} from "@algorandfoundation/algorand-typescript/arc4";

type SendAssetInfo = {
  /**
   * The total number of inner transactions required to send the asset through the router.
   * This should be used to add extra fees to the app call
   */
  itxns: uint64;
  /** The total MBR the router needs to send the asset through the router. */
  mbr: uint64;
  /** Whether the router is already opted in to the asset or not */
  routerOptedIn: boolean;
  /** Whether the receiver is already directly opted in to the asset or not */
  receiverOptedIn: boolean;
  /** The amount of ALGO the receiver would currently need to claim the asset */
  receiverAlgoNeededForClaim: uint64;
  /** The amount of ALGO the receiver would need if their balance dropped to 0 */
  receiverAlgoNeededForWorstCaseClaim: uint64;
};

@contract({ name: "ControlledAddress" })
class ControlledAddress extends Contract {
  @abimethod({ allowActions: "DeleteApplication" })
  public new(): Address {
    itxn.payment({ rekeyTo: Txn.sender }).submit();

    return new Address(Global.currentApplicationAddress);
  }
}

/**
 * ARC59 Router Smart Contract
 *
 * This contract implements the ARC59 standard for sending assets to addresses that may not be opted in.
 * When a receiver is not opted in to an asset, the contract creates an "inbox" (controlled address)
 * that holds the asset until the receiver claims it.
 */
@contract({ name: "Arc59" })
export class Arc59 extends Contract {
  // Maps receiver addresses to their inbox addresses
  inboxes = BoxMap<Address, Address>({ keyPrefix: "inboxes" });

  /**
   * Opt the ARC59 router into the ASA. This is required before this app can be used to send the ASA to anyone.
   *
   * @param asa The ASA to opt into
   */
  public arc59_optRouterIn(asa: Asset): void {
    itxn
      .assetTransfer({
        xferAsset: asa,
        assetAmount: 1,
        assetReceiver: Global.currentApplicationAddress,
      })
      .submit();
  }

  /**
   * Gets the existing inbox for the receiver or creates a new one if it does not exist
   *
   * @param receiver The address to get or create the inbox for
   * @returns The inbox address
   */
  arc59_getOrCreateInbox(receiver: Address): Address {
    if (this.inboxes(receiver).exists) return this.inboxes(receiver).value;

    const compiled = compile(ControlledAddress);
    const txnResult = itxn
      .applicationCall({
        onCompletion: OnCompleteAction.DeleteApplication,
        approvalProgram: compiled.approvalProgram,
        clearStateProgram: compiled.clearStateProgram,
        appArgs: [methodSelector("new()Account")],
        fee: 0,
      })
      .submit();

    const inbox = interpretAsArc4<Address>(txnResult.lastLog, "log");

    this.inboxes(receiver).value = inbox;

    return inbox;
  }

  /**
   * Calculate the requirements for sending an asset to a receiver
   *
   * @param receiver The address to send the asset to
   * @param asset The asset to send
   *
   * @returns Returns the following information for sending an asset:
   * The number of itxns required, the MBR required, whether the router is opted in, whether the receiver is opted in,
   * and how much ALGO the receiver would need to claim the asset
   */
  arc59_getSendAssetInfo(receiver: Address, asset: Asset): SendAssetInfo {
    // Check if this contract (router) and receiver are opted into the asset
    const routerOptedIn = Global.currentApplicationAddress.isOptedIn(asset);
    const receiverAccount = Account(receiver.bytes);
    const receiverOptedIn = receiverAccount.isOptedIn(asset);

    // Initialize info with base requirements (1 itxn for direct transfer)
    let info: SendAssetInfo = {
      itxns: Uint64(1),
      mbr: Uint64(0),
      routerOptedIn,
      receiverOptedIn,
      receiverAlgoNeededForClaim: Uint64(0),
      receiverAlgoNeededForWorstCaseClaim: Uint64(
        Global.minBalance + Global.assetOptInMinBalance + Global.minTxnFee
      ),
    };

    // If receiver is already opted in, no additional complexity needed
    if (receiverOptedIn) return info;

    // Calculate ALGO needed for receiver to claim (opt-in + transaction fees)
    const algoNeededToClaim = Uint64(
      receiverAccount.minBalance +
        Global.assetOptInMinBalance +
        Global.minTxnFee
    );

    // Check if receiver has insufficient ALGO for claiming
    if (receiverAccount.balance < algoNeededToClaim) {
      info = {
        ...info,
        receiverAlgoNeededForClaim: Uint64(
          algoNeededToClaim - receiverAccount.balance
        ),
      };
    }

    // If router isn't opted in, add costs for router opt-in
    if (!routerOptedIn) {
      info = {
        ...info,
        mbr: Uint64(info.mbr + Global.assetOptInMinBalance),
        itxns: Uint64(info.itxns + 1),
      };
    }

    // If inbox doesn't exist, calculate costs for creating it
    if (!this.inboxes(receiver).exists) {
      // Creating inbox requires 4 additional itxns (app call + rekey + opt-ins)
      info = { ...info, itxns: Uint64(info.itxns + 4) };

      // Temporarily create box to calculate MBR delta
      const preMBR = Global.currentApplicationAddress.minBalance;
      this.inboxes(receiver).value = new Address(Global.zeroAddress.bytes);
      const boxMbrDelta = Uint64(
        Global.currentApplicationAddress.minBalance - preMBR
      );
      this.inboxes(receiver).delete();

      // Add MBR for box storage + new inbox account + asset opt-in
      info = {
        ...info,
        mbr: Uint64(
          info.mbr +
            boxMbrDelta +
            Global.minBalance +
            Global.assetOptInMinBalance
        ),
      };
      return info;
    }

    // Inbox exists - check if it needs asset opt-in
    const inbox = this.inboxes(receiver).value;
    const inboxAccount = Account(inbox.bytes);

    if (!inboxAccount.isOptedIn(asset)) {
      // Add itxn for inbox asset opt-in
      info = { ...info, itxns: Uint64(info.itxns + 1) };

      // Check if inbox needs funding for opt-in
      if (
        !(
          inboxAccount.balance >=
          inboxAccount.minBalance + Global.assetOptInMinBalance
        )
      ) {
        info = {
          ...info,
          itxns: Uint64(info.itxns + 1), // Additional payment itxn
          mbr: Uint64(info.mbr + Global.assetOptInMinBalance),
        };
      }
    }

    // Calculate if inbox has ALGO available to help with receiver's claim costs
    if (
      inboxAccount.balance > inboxAccount.minBalance &&
      info.receiverAlgoNeededForClaim !== Uint64(0)
    ) {
      // Calculate ALGO consumed by the claim process itself
      const algoConsumedByClaim = Uint64(
        Global.assetOptInMinBalance +
          (info.itxns + Uint64(4)) * Global.minTxnFee
      );

      // Calculate available ALGO in inbox (above minimum balance)
      let inboxAlgoAvailable =
        inboxAccount.balance > inboxAccount.minBalance
          ? Uint64(inboxAccount.balance - inboxAccount.minBalance)
          : Uint64(0);

      // Subtract claim costs from available ALGO
      inboxAlgoAvailable =
        inboxAlgoAvailable > algoConsumedByClaim
          ? Uint64(inboxAlgoAvailable - algoConsumedByClaim)
          : Uint64(0);

      // Reduce receiver's needed ALGO by what's available in inbox
      if (inboxAlgoAvailable < info.receiverAlgoNeededForClaim) {
        info = {
          ...info,
          receiverAlgoNeededForClaim: Uint64(
            info.receiverAlgoNeededForClaim - inboxAlgoAvailable
          ),
        };
      }
    }

    return info;
  }

  /**
   * Send an asset to the receiver (either directly or to their inbox)
   *
   * @param receiver The address to send the asset to
   * @param axfer The asset transfer to this app
   * @param additionalReceiverFunds The amount of ALGO to send to the receiver/inbox in addition to the MBR
   *
   * @returns The address that the asset was sent to (either the receiver or their inbox)
   */
  arc59_sendAsset(
    axfer: gtxn.AssetTransferTxn,
    receiver: Address,
    additionalReceiverFunds: uint64
  ): Address {
    const receiverAccount = Account(receiver.bytes);

    // Direct transfer if receiver is already opted in to the asset
    if (receiverAccount.isOptedIn(axfer.xferAsset)) {
      itxn
        .assetTransfer({
          assetReceiver: receiverAccount,
          assetAmount: axfer.assetAmount,
          xferAsset: axfer.xferAsset,
        })
        .submit();

      // Send additional ALGO if specified
      if (additionalReceiverFunds !== Uint64(0)) {
        itxn
          .payment({
            receiver: receiverAccount,
            amount: additionalReceiverFunds,
          })
          .submit();
      }

      return receiver;
    }

    // Receiver not opted in - use inbox system
    const inboxExisted = this.inboxes(receiver).exists;
    const inbox = this.arc59_getOrCreateInbox(receiver);
    const inboxAccount = Account(inbox.bytes);

    // Ensure inbox is opted into the asset
    if (!inboxAccount.isOptedIn(axfer.xferAsset)) {
      // Calculate MBR needed for opt-in (includes new inbox account if just created)
      let inboxMbrDelta = Global.assetOptInMinBalance;
      if (!inboxExisted)
        inboxMbrDelta = Uint64(inboxMbrDelta + Global.minBalance);

      // Fund inbox if it doesn't have enough ALGO for opt-in
      if (
        inboxAccount.balance < Uint64(inboxAccount.minBalance + inboxMbrDelta)
      ) {
        itxn
          .payment({
            receiver: inboxAccount,
            amount: inboxMbrDelta,
          })
          .submit();
      }

      // Perform the asset opt-in for the inbox
      itxn
        .assetTransfer({
          sender: inboxAccount,
          assetReceiver: inboxAccount,
          assetAmount: Uint64(0),
          xferAsset: axfer.xferAsset,
        })
        .submit();
    }

    // Transfer the asset to the inbox
    itxn
      .assetTransfer({
        assetReceiver: inboxAccount,
        assetAmount: axfer.assetAmount,
        xferAsset: axfer.xferAsset,
      })
      .submit();

    // Send additional ALGO to inbox if specified
    if (additionalReceiverFunds !== Uint64(0)) {
      itxn
        .payment({
          receiver: inboxAccount,
          amount: additionalReceiverFunds,
        })
        .submit();
    }

    return inbox;
  }

  /**
   * Claim an ASA from the caller's inbox
   * Transfers the asset and any excess ALGO to the caller
   *
   * @param asa The ASA to claim
   */
  arc59_claim(asa: Asset): void {
    const sender = Txn.sender;
    const senderAddress = new Address(Txn.sender);

    // Get the caller's inbox
    const inbox = this.inboxes(senderAddress).value;
    const inboxAccount = Account(inbox.bytes);

    // Transfer all ASA from inbox to caller and close the asset holding
    itxn
      .assetTransfer({
        sender: inboxAccount,
        assetReceiver: sender,
        assetAmount: asa.balance(inboxAccount),
        xferAsset: asa,
        assetCloseTo: sender,
      })
      .submit();

    // Transfer any excess ALGO (above minimum balance) to caller
    const excessAlgo = Uint64(inboxAccount.balance - inboxAccount.minBalance);
    if (excessAlgo > Uint64(0)) {
      itxn
        .payment({
          sender: inboxAccount,
          receiver: sender,
          amount: excessAlgo,
        })
        .submit();
    }
  }

  /**
   * Reject an ASA by sending it back to the asset creator
   * All non-MBR ALGO balance in the inbox will be sent to the caller
   *
   * @param asa The ASA to reject
   */
  arc59_reject(asa: Asset): void {
    const sender = Txn.sender;
    const senderAddress = new Address(Txn.sender);

    // Get the caller's inbox
    const inbox = this.inboxes(senderAddress).value;
    const inboxAccount = Account(inbox.bytes);

    // Send all ASA back to the creator and close the asset holding
    itxn
      .assetTransfer({
        sender: inboxAccount,
        assetReceiver: asa.creator,
        assetAmount: asa.balance(inboxAccount),
        xferAsset: asa,
        assetCloseTo: asa.creator,
      })
      .submit();

    // Send excess ALGO to the caller (rejection doesn't forfeit ALGO)
    const excessAlgo = Uint64(inboxAccount.balance - inboxAccount.minBalance);
    if (excessAlgo > Uint64(0)) {
      itxn
        .payment({
          sender: inboxAccount,
          receiver: sender,
          amount: excessAlgo,
        })
        .submit();
    }
  }

  /**
   * Get the inbox address for the given receiver
   *
   * @param receiver The receiver to get the inbox for
   *
   * @returns Zero address if the receiver does not yet have an inbox, otherwise the inbox address
   */
  arc59_getInbox(receiver: Address): Address {
    return this.inboxes(receiver).exists
      ? this.inboxes(receiver).value
      : new Address(Global.zeroAddress);
  }

  /**
   * Claim only ALGO from the caller's inbox (without touching assets)
   * Useful for withdrawing excess ALGO without claiming assets
   */
  public arc59_claimAlgo(): void {
    const sender = Txn.sender;
    const senderAddress = new Address(Txn.sender);

    // Get the caller's inbox
    const inbox = this.inboxes(senderAddress).value;
    const inboxAccount = Account(inbox.bytes);

    // Ensure there's ALGO to claim (above minimum balance requirement)
    assert(inboxAccount.balance - inboxAccount.minBalance !== 0);

    // Transfer all excess ALGO to caller
    itxn
      .payment({
        sender: inboxAccount,
        receiver: sender,
        amount: Uint64(inboxAccount.balance - inboxAccount.minBalance),
      })
      .submit();
  }
}
