const nearAPI = require("near-api-js");
const config = require("./config");
const { sleep } = require("./utils");

const { keyStores, KeyPair, connect, Contract, providers } = nearAPI;
const myKeyStore = new keyStores.InMemoryKeyStore();

const connectionConfig = {
    networkId: config.NEAR_NET,
    keyStore: myKeyStore, // first create a key store 
    nodeUrl: config.NEAR_NODE_RPC,
};

var nearConnection = null;

async function nearInit() {
    nearConnection = await connect(connectionConfig);
    await myKeyStore.setKey(config.NEAR_NET, config.CONTRACT_ACCOUNT, KeyPair.fromString(config.CONTRACT_ACCOUNT_KEY));
}

async function getContract(_account = config.CONTRACT_ACCOUNT) {
    const account = await nearConnection.account(_account);
    const contract = new Contract(
        account,
        config.CONTRACT_ACCOUNT,
        {
            changeMethods: ["ready", "lottery"],
            viewMethods: ["get_state"],
        }
    );
    return contract;
}

async function getState() {
    const contract = await getContract();
    try {
        const response = await contract.get_state();
        if (!response) return "";
        return response;
    } catch (e) {
        return e.message;
    }
}

async function ready() {
    const contract = await getContract();
    const response = await contract.ready();
    if (response === "") return 0;
    return response;
}

async function lottery() {
    const contract = await getContract();
    const response = await contract.lottery();
    if (response === "") return 0;
    return response;
}



var isRun = true;

process.on('SIGINT', async function () {
    console.info("Near server stop...");
    isRun = false;
});

async function checkTime(waitTime, callbakc) {
    let wt = waitTime / 1000000000;        // wait_time的值为纳秒
    wt = wt - new Date().getTime() / 1000;  // getTime的值为毫秒
    let waitTimeValue = Math.floor(wt);
    while (isRun) {
        if (waitTimeValue <= 0) {
            await callbakc();
            break;
        } else {
            waitTimeValue -= 1;
            await sleep(1);
        }
    }
}

async function checkGame() {
    await nearInit();
    let interval = 3;
    while (isRun) {
        try {
            let data = await getState();
            if (data) {
                let { status, wait_time, ready_time } = data;
                if (status) {
                    switch (status) {
                        case "Init":
                            interval = 5;
                            break;
                        case "Wait":
                            await checkTime(wait_time, ready);
                            break;
                        case "Ready":
                            await checkTime(ready_time, lottery);
                            break;
                    }
                } else {
                    interval = 3;
                }
            }
            await sleep(interval);
        } catch (e) {
            console.error("checkGame error: ", e);
            await sleep(3);
        }
    }
}

Promise.all([
    checkGame(),
]).then(async res => {
    console.info("Near server stopped.");
}).catch(e => {
    console.error("Near server error:", e);
}).finally(() => {
    process.exit();
})

