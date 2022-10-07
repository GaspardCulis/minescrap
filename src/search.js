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
    if(server_exists) {
        database.updateServerData(data.ip, {lastTimeOnline: Date.now()}).catch(e => console.log);
        console.log("\t╘═► Server already exists, updating lastTimeOnline");
    } else {
        data.discovered = Date.now();
        data.lastTimeOnline = data.discovered;
        database.addServer(data).catch(e => console.log);
    }
    if (data.players) {
        let players = data.players.sample ? data.players.sample : (Array.isArray(data.players) ? data.players : []);
        if (players.length > 0) {
            console.log("\t╘═► Players online: " + players.map(p => p.name).join(", "));
        }
        players.forEach(async player => {
            if (!(player.id && player.name)) return;
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
                    console.log(`\t[RARE] ${player.name} is a fancy boy he also plays on ${data.ip}`);
                } else {
                    servers_played[server_index].lastTimeOnline = Date.now();
                }
                database.updatePlayerData(player.id, player_data.data).catch(e => console.log);
            }
        });
    }
}


masscan.on("found", async (ip, ports) => {
    status.getStatus(ip, 25565).then((response) => {
        response.ip = ip;
        response.ping = undefined;
        console.log(`Found : ${ip} on port ${ports}   |   rate=${masscan.rate} percentage=${masscan.percentage}%`);
        onServerFound(response);
    }).catch((reason) => {});
})

masscan.on("error", (msg) => {
    console.log(msg);
})

masscan.start("0.0.0.0/0", "25565", argv.rate ? argv.rate : 10000, "data/exclude.conf");
