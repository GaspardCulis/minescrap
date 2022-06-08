const Utils = require('./utils');

console.log(Utils.getPlayersNames().length)

let database = Utils.getDatabase();

console.log(database.servers.length)

