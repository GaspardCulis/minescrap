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
            if (auto_restart) console.log(IP+' in '+res.version.name+' server found');
            storeServer(IP, res);
            callback(res, null);
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
        servers.forEach(server => {
            newFind(server.IP,(response, err)=>{
                if (err) {
                    offline += 1;
                } else {
                    online += 1;
                }
                progressBar.update(online+offline);
            }, 25565, false);
        })
        while(active_queries !=0) {
            await Utils.sleep(100);
        }
        progressBar.stop();
        console.log('Updated '+servers.length.toString()+' servers. \n\t├ Online: '+online.toString()+' \n\t└ Offline: '+offline.toString());
    }
}

function storeServer(IP, query) {
    let timestamp = Date.now();
    let database = Utils.getDatabase();
    Utils.findServer(IP, (out, index) => {
        if (out) {
            // Updating server in DB
            out.lastTimeOnline = timestamp;
            if (query.players.sample) {
                for(let player of query.players.sample) {
                    let playerIndex = -1;
                    for(let i=0; i<out.players.length; i++) {
                        if (out.players[i].name==player.name) {
                            playerIndex = i;
                            break;
                        }
                    }
                    if (playerIndex>=0) {
                        out.players[playerIndex].lastTimeOnline = timestamp
                    } else {
                        let newPlayer = player;
                        newPlayer.lastTimeOnline = timestamp;
                        out.players.push(newPlayer);
                    }
                }
            }
            database.servers[index] = out;
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
                "IP":IP,
                "description":query.description.text,
                "version":query.version.name,
                "players":players,
                "discovered":timestamp,
                "lastTimeOnline":timestamp
            }
            database.servers.push(newElement);
            console.log(IP+' in '+query.version.name+' new server stored')
        }
        Utils.storeDatabase(database);
    })
}

/*
for (let i=0; i<MAX_QUERIES; i++) {
    newFind(Utils.generateIp())
}*/



updateServers()
