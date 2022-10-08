const {Masscan} = require("./masscan-node");
const status = require("mc-server-status");
const database = require("./database");
const yargs = require('yargs');

const argv = yargs
  .option('rate', {
    alias: 'r',
    description: 'The masscar max rate',
    type: 'number'
  })
  .option('verbose', {
    alias: 'v',
    description: 'Verbose new server data',
    type: 'boolean'
})
  .help()
  .alias('help', 'h').argv;

let masscan = new Masscan();

function print(msg) {
    if (argv.verbose) {
        console.log(msg);
    }
}

async function onServerFound(data) {
    let server_exists = await database.serverExists(data.ip).catch(e => {throw e});
    // First checking players
    let players;
    if (data.players) {
        players = data.players.sample || [];
        data.players.sample = players;
        if (players.length > 0) {
            print("\t╘═► Players online: " + players.map(p => p.name).join(", "));
        }
        players.forEach(async player => {
            if (!(player.id && player.name) | player.name.startsWith("§")) return;
            let player_exists = await database.playerIdExists(player.id).catch(e => {throw e});
            if(!player_exists) {
                player.serversPlayed = [
                    {
                        ip: data.ip,
                        lastTimeOnline: Date.now()
                    }];
                database.setPlayer(player).catch(e => {throw e});
            } else {
                let player_data = await database.getPlayerData(player.id).catch(e => {throw e});
                let servers_played = player_data.serversPlayed;
                let server_index = servers_played.findIndex(s => s.ip == data.ip);
                if(server_index == -1) {
                    servers_played.push({
                        ip: data.ip,
                        lastTimeOnline: Date.now()
                    });
                    print(`\t[RARE] ${player.name} is a fancy boy he plays on ${servers_played.map(s => s.ip).join(", ")}`);
                } else {
                    servers_played[server_index].lastTimeOnline = Date.now();
                }
                database.setPlayer(player_data).catch(e => {throw e});
            }
        });
    }
    // Then updating server data
    if(server_exists) {
        print("\t╘═► Server already exists, updating lastTimeOnline");
        let oldData = await database.getServerByIp(data.ip).catch(e => {throw e});
        if (players) {
            oldData.players.sample.push(...data.players.sample);
        }
        oldData.lastTimeOnline = Date.now();

        database.setServer(oldData).catch(e => {throw e});
    } else {
        data.discovered = Date.now();
        data.lastTimeOnline = data.discovered;
        database.setServer(data).catch(e => {throw e});
    }
}


masscan.on("found", async (ip, ports) => {
    status.getStatus(ip, 25565, {timeout: 1500}).then((response) => {
        response.ip = ip;
        response.ping = undefined;
        response.favicon = undefined;
        if (response.forgeData || response.modinfo || response.modpackData) {
            response.forgeData = undefined;
            response.modinfo = undefined;
            response.modpackData = undefined;
            response.modded = true;
        }
        print(`Found : ${ip} on port ${ports}   |   rate=${masscan.rate} percentage=${masscan.percentage}%`);
        onServerFound(response).catch(e => {throw e});
    }).catch((reason) => {});
})

masscan.on("error", (msg) => {
    console.log(msg);
})

masscan.start("0.0.0.0/0", "25565", argv.rate ? argv.rate : 10000, "data/exclude.conf");
