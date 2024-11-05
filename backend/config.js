require("dotenv").config();

const NEAR_NET = process.env.NEAR_NET ?? "testnet";
const NEAR_NODE_RPC = process.env.NEAR_NODE_RPC ?? "https://rpc.testnet.pagoda.co";

const CONTRACT_ACCOUNT = "max30.necklace-dev.testnet";
const CONTRACT_ACCOUNT_KEY = process.env.CONTRACT_ACCOUNT_KEY;


module.exports = {
    NEAR_NET,
    NEAR_NODE_RPC,
    CONTRACT_ACCOUNT,
    CONTRACT_ACCOUNT_KEY
}