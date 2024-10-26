#!/bin/sh

./build.sh

if [ $? -ne 0 ]; then
  echo ">> Error building contract"
  exit 1
fi

echo ">> Deploying contract"

export CONTRACT_ID=max30.necklace-dev.testnet

near deploy $CONTRACT_ID ./target/wasm32-unknown-unknown/release/max30.wasm \
--initFunction new --initArgs '{"owner_id": "$(CONTRACT_ID)"}' --accountId $CONTRACT_ID \
--networkId testnet --node_url  https://rpc.testnet.pagoda.co