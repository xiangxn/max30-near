const express = require('express');
const child_process = require('child_process');
const { sleep } = require("./utils");
const path = require('path');


// server
var processRun = true;
async function checkStoped() {
    while (processRun) {
        await sleep(1)
    }
    return;
}

process.on('SIGINT', async function () {
    await checkStoped();
    process.exit(1);
});

var service_process = child_process.fork("./backend/server.js");
service_process.on("exit", (code) => {
    processRun = false;
});

// web
const app = express();
const port = 3000;
const ROOTDIR = path.join(__dirname, '../frontend/build/web-desktop');

app.use(express.static(ROOTDIR));

app.get('/', (req, res) => {
    res.sendFile(path.join(ROOTDIR, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
