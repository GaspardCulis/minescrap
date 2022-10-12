const {createClient} = require("redis");
const {
    Entity,
    Schema,
    Repository,
    Client
} = require("redis-om");

require('dotenv').config();

const redis = createClient({
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    },
    username: process.env.REDIS_USER,
    password: process.env.REDIS_PASSWORD
})

const client = new Client();

async function connectClient() {
    if (!client.isOpen()) {
        await redis.connect();
        await client.use(redis);
        await client.fetchRepository(serverSchema).createIndex();
        await client.fetchRepository(playerSchema).createIndex();
        console.info("Database is ready.");
    }
    return client;
}

connectClient();

class Server extends Entity{}
const serverSchema = new Schema(Server, {
    ip: { type: 'string' },
    description: { type: 'text' },
    version: { type: 'text' },
    protocol: { type: 'number', sortable: true },
    modded: { type: 'boolean' },
    allow_crack: { type: 'boolean' },
    whitelist: { type: 'boolean' },
    max_players: { type: 'number' },
    online: { type: 'number', sortable: true },
    players: { type: 'string[]' },
    discovered: { type: 'date' },
    lastTimeOnline: { type: 'date' }
})

class Player extends Entity {}
const playerSchema = new Schema(Player, {
    id: { type: 'string' },
    name: { type: 'text', indexed: true },
    serversPlayed: { type: 'string[]' }
});

/**
 * Adds/updates server to database
 * @param {Object} data
 * @param {String} data.ip,
 * @param {String} data.description
 * @param {String} data.version
 * @param {number} data.protocol
 * @param {boolean} data.modded
 * @param {boolean} data.allow_crack
 * @param {boolean} data.whitelist
 * @param {Array<String>} data.players
 * @param {number} data.max_players
 * @param {number} data.online
 * @param {number} data.discovered
 * @param {number} data.lastTimeOnline
 * @returns {Promise<void>}
 */
 async function setServer(data) {
    const sr = client.fetchRepository(serverSchema);
    let server = sr.createEntity(data);
    server.entityId = data.ip;
    await sr.save(server);
}

/**
 * Checks if server is present in database
 * @param {String} server_ip
 * @returns {Promise<boolean>}
 */
async function serverExists(server_ip) {
    return client.execute(['EXISTS', `Server:${server_ip}`]);
}

/**
 * Returns the total number of servers in the database
 * @returns {Promise<number>}
 */
async function getServerCount() {
    return client.fetchRepository(serverSchema).search().count();
}

/**
 * @param {String} ip 
 * @returns {Promise<object>}
 */
async function getServerByIp(ip) {
    return redis.json.get(`Server:${ip}`);
}

/**
 * @param {Object} filters
 * @param {String} filters.version
 * @param {boolean} filters.modded
 * @param {String} filters.min_players
 * @param {number} filters.max_results
 * @param {('RANDOM'|'RECENT'|'PLAYER_COUNT')} filters.sort
 * @param {boolean} filters.sortAscending
 */
async function getServers(filters) {
    filters = filters || {};
    filters.sort = filters.sort ? filters.sort.toUpperCase() : undefined;
    filters.reverse = (filters.reverse || false) ? -1 : 1;
    filters.max_results = parseInt(filters.max_results);
    
    let results = client.fetchRepository(serverSchema).search().where('online').greaterThanOrEqualTo(filters.min_players | 0);
    
    if (filters.version) 
        results = results.and('version').match(`*${filters.version}*`);
    if (filters.modded !== undefined) {
        results = results.and('modded')
        if (filters.modded)
            results = results.true();
        else
            results = results.false();
    }

    if (filters.max_results)
        results = await results.return.page(0, filters.max_results);
    else
        results = await results.return.all();

    

    switch (filters.sort) {
        case "RANDOM":
            results.sort(() => Math.random() - 0.5);
            break;
        case "RECENT":
            results.sort((a, b) => (b.lastTimeOnline - a.lastTimeOnline) * filters.reverse);
            break;
        case "PLAYER_COUNT":
            results.sort((a, b) => (b.players.length - a.players.length) * filters.reverse);
            break;
    }

    return results;
}

/**
 * Adds player to the player list
 * @param {Object} data
 * @param {String} data.id
 * @param {String} data.name
 * @param {Array<String>} data.serversPlayed
 * @returns {Promise<void>}
 */
 async function setPlayer(data) {
    const sr = client.fetchRepository(playerSchema)
    let player = sr.createEntity(data);
    player.entityId = data.id;
    await sr.save(player);
}

/**
 * Checks if a player uuid is present in database
 * @param {String} player_id
 * @returns {Promise<boolean>}
 */
function playerIdExists(player_id) {
    return client.execute(['EXISTS', `Player:${player_id}`]);
}

/**
 * Gets player data from database
 * @param {String} player_id 
 * @returns {Promise<object>} Player data is in the root data property
 */
async function getPlayerData(player_id) {
    return redis.json.get(`Player:${player_id}`);
}

/**
 * 
 * @returns {Promise<object>}
 */
async function getPlayers() {
    return client.fetchRepository(playerSchema).search().return.all();
}

/**
 * Returns the total number of players in the database
 * @returns {Promise<object>}
 */
function getPlayerCount() {
    return client.fetchRepository(playerSchema).search().count();
}

module.exports = {
    serverExists: serverExists,
    setServer: setServer,
    getServerCount: getServerCount,
    playerIdExists: playerIdExists,
    setPlayer: setPlayer,
    getPlayerData: getPlayerData,
    getPlayerCount: getPlayerCount,
    getServers: getServers,
    getServerByIp: getServerByIp,
    getPlayers: getPlayers,
}