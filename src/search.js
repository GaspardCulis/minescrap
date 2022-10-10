const {Masscan} = require("./masscan-node");
const status = require("mc-server-status");
const database = require("./database");
const yargs = require('yargs');
const { exit } = require("yargs");

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
    let players = (data.players ? data.players : {}).sample || [];
    players = players.filter(p => (p && p.id && p.id.length > 10 && p.name && !p.name.startsWith("§")));

    if (players.length > 0) {
        print("\t╘═► Players online: " + players.map(p => (p || {}).name).join(", "));
    }
    players.forEach(async player => {
        let player_exists = await database.playerIdExists(player.id).catch(e => {throw e});
        if(!player_exists) {
            player.serversPlayed = [data.ip];
            database.setPlayer(player).catch(e => {throw e});
        } else {
            let player_data = await database.getPlayerData(player.id).catch(e => {throw e});
            let servers_played = player_data.serversPlayed;
            let server_index = servers_played.findIndex(s => s == data.ip);
            if(server_index == -1) {
                servers_played.push(data.ip);
                print(`\t[RARE] ${player.name} is a fancy boy he plays on ${servers_played.join(", ")}`);
            }
            database.setPlayer(player_data).catch(e => {throw e});
        }
    });
    
    // Then updating server data
    let discovered = new Date()
    if(server_exists) {
        print("\t╘═► Server already exists, updating lastTimeOnline");
        let oldData = await database.getServerByIp(data.ip).catch(e => {throw e});
        for (let player of players) {
            player.serversPlayed = undefined;
            if (!oldData.players.some(p => p === player.id)) {
                oldData.players.push(player.id);
                print(`\t╘═► ${player.name} is a new player on that server (${player.id})`);
            }
        }
        discovered = oldData.discovered;
        players = oldData.players.filter(p => (p && p.length > 10));
        database.setServer(oldData).catch(e => {throw e});
    } 
    data.discovered = discovered;
    data.lastTimeOnline = Date.now();
    database.setServer({
        ip: data.ip,
        description: typeof data.description == "string" ? data.description : JSON.stringify(data.description),
        version: (data.version ? data.version : {}).name || null,
        protocol: (data.version ? data.version : {}).protocol || null,
        modded: data.modded,
        players: players.map(p => p.id),
        max_players: (data.players ? data.players : {}).max || null,
        online: (data.players ? data.players : {}).online || null,
        discovered: discovered,
        lastTimeOnline: new Date()
    }).catch(e => {throw e});
    
}


masscan.on("found", async (ip, ports) => {
    status.getStatus(ip, 25565, {timeout: 1500}).then((response) => {
        response.ip = ip;
        response.ping = undefined;
        response.favicon = undefined;
        response.modded = false;
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

masscan.on("finished", () => {
    console.log("Congrats, you scanned the entire internet !");
    exit(0);
})

masscan.start("0.0.0.0/0", "25565", argv.rate ? argv.rate : 10000, "data/exclude.conf");
