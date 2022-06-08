fs = require('fs');

function randInt(min, max) {
    return min + Math.floor(Math.random()*(max-min))
}

exports.generateIp = generateIp
function generateIp() {
    return randInt(0,256).toString()+'.'+randInt(0,256).toString()+'.'+randInt(0,256).toString()+'.'+randInt(0,256).toString()
}

exports.findServer = findServer
function findServer(IP, callback) {
    const database = getDatabase();
    let i=0;
    database.servers.forEach(element => {
        if(element.IP==IP) {
            callback(element, i)
            return
        }
        i++;
        if(i==database.servers.length) {
            callback(null, null)
            return
        }
    });
}

exports.storeDatabase = storeDatabase;
function storeDatabase(database) {
    let data = JSON.stringify(database, null, "\t");
    fs.writeFileSync('database.json', data);
}
  
exports.getDatabase = getDatabase;
function getDatabase() {
    try {
        return JSON.parse(fs.readFileSync('database.json'));
    } catch {
        return getDatabase();
    }
}

exports.getPlayersNames = getPlayersNames;
function getPlayersNames() {
    let database = getDatabase();
    let out = [];
    for (let server of database.servers) {
        for (let player of server.players) {
            out.push(player.name);
        }
    }
    return out;
}

exports.sleep = sleep;
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
