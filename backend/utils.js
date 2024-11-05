const sleep = async (interval) => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, interval * 1000);
    })
}

module.exports = { sleep }