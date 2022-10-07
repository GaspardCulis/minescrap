const {Masscan} = require("./masscan-node");
const status = require("mc-server-status");
const database = require("./database");

let masscan = new Masscan();

async function onServerFound(data) {
    
    if(await database.serverExists(data.ips).catch(e => console.log)) {
        database.updateServerData(data.ip, {lastTimeOnline: Date.now()}).catch(e => console.log);
    } else {
        data.discovered = Date.now();
        data.lastTimeOnline = data.discovered;
        database.addServer(data).catch(e => console.log);
    }
}


masscan.on("found", async (ip, ports) => {
    status.getStatus(ip, 25565).then((response) => {
        response.ip = ip;
        response.favicon = undefined;
        response.ping = undefined;
        console.log(`Found : ${ip} on port ${ports}   |   rate=${masscan.rate} percentage=${masscan.percentage}%`);
        onServerFound(response);
    }).catch((reason) => {});
})

masscan.start("0.0.0.0/0", "25565", process.argv.length > 2 ? process.argv[3] : 10000, "data/exclude.conf");
