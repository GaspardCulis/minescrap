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
    return JSON.parse(fs.readFileSync('database.json'));
}

exports.getPlayersNames = getPlayersNames;
function getPlayersNames() {
    let database = getDatabase();
    let out = [];
    for (let k in database.servers) {
        for (let player of database.servers[k].players) {
            out.push(player.name);
        }
    }
    return out;
}

exports.getDatabaseInfo = getDatabaseInfo;
function getDatabaseInfo() {
    let database = getDatabase();
    let out = {
        servers: Object.keys(database.servers).length,
        players: 0,
    }
    for (let k in database.servers) {
        out.players += database.servers[k].players.length;
    }
    console.log(`Found ${out.servers} servers with ${out.players} players`);
    return out;
}

exports.getPlayerInfo = getPlayerInfo;
function getPlayerInfo(name) {
    let database = getDatabase();
    for (let k in database.servers) {
        for (let player of database.servers[k].players) {
            if(player.name==name) {
                console.log(`Found player ${name} on server ${k}`);
                player.lastTimeOnline = new Date(player.lastTimeOnline);
                console.log(player);
            }
        }
        
    }
}

exports.sleep = sleep;
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
