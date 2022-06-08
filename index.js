const Search = require('./search');
const Utils = require('./utils');


var arguments = process.argv.slice(2);

switch (arguments[0]) {
    case 'search':
        Search.searchServers();
        break;
    case 'update':
        Utils.updateServers();
        break;
    case 'info':
        Utils.getDatabaseInfo();
        break;
    case 'players':
        if (arguments.length == 2) {
            Utils.getPlayerInfo(arguments[1]);
        } else {
            console.log(Utils.getPlayersNames());
        }
        break;
    default:
        console.log('Usage:');
        console.log('  node index.js search');
        console.log('  node index.js update');
        console.log('  node index.js info');
        console.log('  node index.js players <player>');
        break;
}
