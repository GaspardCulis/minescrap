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
  .help()
  .alias('help', 'h').argv;

let masscan = new Masscan();

async function onServerFound(data) {
    let server_exists = await database.serverExists(data.ips).catch(e => console.log)
    // First checking players
    let players;
    if (data.players) {
        players = data.players.sample || [];
        data.players.sample = players;
        if (players.length > 0) {
            console.log("\t╘═► Players online: " + players.map(p => p.name).join(", "));
        }
        players.forEach(async player => {
            if (!(player.id && player.name) | player.name.startsWith("§")) return;
            let player_exists = await database.playerIdExists(player.id).catch(e => console.log);
            if(!player_exists) {
                player.serversPlayed = [
                    {
                        ip: data.ip,
                        lastTimeOnline: Date.now()
                    }];
                database.addPlayer(player).catch(e => console.log);
            } else {
                let player_data = await database.getPlayerData(player.id).catch(e => console.log);
                let servers_played = player_data.data.serversPlayed;
                let server_index = servers_played.findIndex(s => s.ip == data.ip);
                if(server_index == -1) {
                    servers_played.push({
                        ip: data.ip,
                        lastTimeOnline: Date.now()
                    });
                    console.log(`\t[RARE] ${player.name} is a fancy boy he plays on ${servers_played.map(s => s.ip).join(", ")}`);
                } else {
                    servers_played[server_index].lastTimeOnline = Date.now();
                }
                database.updatePlayerData(player.id, player_data.data).catch(e => console.log);
            }
        });
    }
    // Then updating server data
    if(server_exists) {
        let oldData = await database.getServerByIp(data.ip).catch(e => console.log);
        if (players) {
            data.players.sample.push(...oldData.data.players.sample);
        }

        database.updateServerData(data.ip, {lastTimeOnline: Date.now(), players: [...new Set(data.players.sample)]}).catch(e => console.log);
        console.log("\t╘═► Server already exists, updating lastTimeOnline");
    } else {
        data.discovered = Date.now();
        data.lastTimeOnline = data.discovered;
        database.addServer(data).catch(e => console.log);
    }
}


masscan.on("found", async (ip, ports) => {
    status.getStatus(ip, 25565).then((response) => {
        response.ip = ip;
        response.ping = undefined;
        response.favicon = undefined;
        if (response.forgeData || response.modinfo || response.modpackData) {
            response.forgeData = undefined;
            response.modinfo = undefined;
            response.modpackData = undefined;
            response.modded = true;
        }
        console.log(`Found : ${ip} on port ${ports}   |   rate=${masscan.rate} percentage=${masscan.percentage}%`);
        onServerFound(response);
    }).catch((reason) => {});
})

masscan.on("error", (msg) => {
    console.log(msg);
})

masscan.start("0.0.0.0/0", "25565", argv.rate ? argv.rate : 10000, "data/exclude.conf");
