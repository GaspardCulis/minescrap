const Utils = require('./utils');
const mcping = require('mc-ping-updated');
const cliProgress = require('cli-progress');
fs = require('fs');

var active_queries = 0;
const MAX_QUERIES = 10000;

function newFind(IP, callback=(response, err)=>{}, PORT=25565, auto_restart=true) {
    active_queries += 1;
    mcping(IP, PORT, function(err, res) {
        if (err) {
            // Some kind of error
            callback(null, err);
        } else {
                // Success!
            storeServer(IP, res, (response)=>{
                callback(response, null); 
            });
        }

        active_queries -= 1;
        if (active_queries < MAX_QUERIES & auto_restart) {
            newFind(Utils.generateIp());
        }

    }, 1000)

}

async function updateServers() {
    let database = Utils.getDatabase();
    let splitedServers = [ ]
    let index = 0;
    let online = 0;
    let offline = 0;
    let new_players = 0;
    console.log('Spliting servers in chunks of '+MAX_QUERIES);
    do {
        let old_index = index;
        index = Math.min(index+MAX_QUERIES, database.servers.length)
        splitedServers.push( database.servers.slice(old_index, index) )
    } while(index!=database.servers.length);
    console.log('Splited servers: '+splitedServers.length);
    const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    progressBar.start(database.servers.length, 0);
    for (let servers of splitedServers) {
        for (let server of servers) {
            newFind(server.IP,(response, err)=>{
                if (err) {
                    offline += 1;
                } else {
                    online += 1;
                    new_players += response.new_players;
                }
                progressBar.update(online+offline);
            }, 25565, false);
        }
    }
    while(active_queries !=0) {
        await Utils.sleep(1000);
        console.log('Waiting for queries to finish... ('+active_queries+')');
    }
    progressBar.stop();
    console.log('Updated '+database.servers.length.toString()+' servers. \n\t├ Online: '+online.toString()+' \n\t├ Offline: '+offline.toString()+' \n\t└ New players: '+new_players.toString());
}

function searchServers() {
    const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    console.log('Loading workers...');
    progressBar.start(MAX_QUERIES, 0);
    for (let i=0; i<MAX_QUERIES; i++) {
        newFind(Utils.generateIp());
        progressBar.update(i+1);
    }
    progressBar.stop();
}

function storeServer(IP, query, callback=(response)=>{}) {
    let timestamp = Date.now();
    let database = Utils.getDatabase();
    let response = {
        new_players: 0
    };
    
    if (IP in database.servers) {
        // Updating server in DB
        database.servers[IP].lastTimeOnline = timestamp;
        if (query.players.sample) {
            let players = database.servers[IP].players
            for(let player of query.players.sample) {
                let playerIndex = 0;
                while (playerIndex<players.length & 
                        players[playerIndex].name!=player.name) {
                    playerIndex+=1;
                }
                if (playerIndex<players.length) {
                    players[playerIndex].lastTimeOnline = timestamp
                } else {
                    let newPlayer = player;
                    newPlayer.lastTimeOnline = timestamp;
                    players.push(newPlayer);
                    response.new_players += 1;
                }
            }
        }
    } else {
        // Adding new server to DB
        let players = [];
        if (query.players.sample) {
            for(let player of query.players.sample) {
                let newPlayer = player;
                newPlayer.lastTimeOnline = timestamp;
                players.push(newPlayer);
            }
        }
        let newElement = {
            "description":query.description.text,
            "version":query.version.name,
            "players":players,
            "discovered":timestamp,
            "lastTimeOnline":timestamp
        }
        database.servers[IP] = newElement;
        console.log(IP+' in '+query.version.name+' new server stored with '+players.length.toString()+' players online');
    }
    Utils.storeDatabase(database);
    callback(response);
}

/*
for (let i=0; i<MAX_QUERIES; i++) {
    newFind(Utils.generateIp())
}*/



//updateServers()
searchServers()