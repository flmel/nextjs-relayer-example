import { connect, KeyPair } from 'near-api-js';
import { InMemoryKeyStore } from 'near-api-js/lib/key_stores';
import { NextResponse } from "next/server";
import { actionCreators } from "@near-js/transactions";
const { signedDelegate } = actionCreators;

const setupKeyStore = async ({ relayerAccountId, relayerAccountPk }: { relayerAccountId: string, relayerAccountPk: string }) => {
  const keyStore = new InMemoryKeyStore();
  await keyStore.setKey("testnet", relayerAccountId, KeyPair.fromString(relayerAccountPk));

  return keyStore;
}

const setupConnection = async (keyStore: InMemoryKeyStore) => {
  const connectionConfig = {
    networkId: "testnet",
    keyStore,
    nodeUrl: "https://rpc.testnet.near.org",
  };

  return await connect(connectionConfig);
}

const setupRelayer = async () => {
  const { RELAYER_ACCOUNT_PRIVATE_KEY, RELAYER_ACCOUNT_ID } = process.env;
  const keyStore = await setupKeyStore({
    relayerAccountId: RELAYER_ACCOUNT_ID,
    relayerAccountPk: RELAYER_ACCOUNT_PRIVATE_KEY
  });
  const nearConnection = await setupConnection(keyStore);
  const relayerAccount = await nearConnection.account(RELAYER_ACCOUNT_ID);

  return relayerAccount;
}

export async function POST(req: Request) {
  const body = await req.json();
  const { delegate } = body;

  try {
    const relayerAccount = await setupRelayer();

    const result = await relayerAccount.signAndSendTransaction({
      actions: [signedDelegate(delegate)],
      receiverId: delegate.delegateAction.senderId,
    });

    return NextResponse.json(
      { result },
      {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      }
    );
  } catch (error) {
    // Custom error handling as needed
    throw error;
  }
}
