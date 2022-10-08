const redis = require("redis");

require('dotenv').config()

const client = redis.createClient({
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    },
    username: process.env.REDIS_USER,
    password: process.env.REDIS_PASSWORD
})

client.connect();

/**
 * Adds new server to database
 * @param {Object} data
 * @param {String} data.ip,
 * @param {String | Object | Array} data.description
 * @param {Object} data.version
 * @param {String} data.version.name
 * @param {number} data.version.protocol
 * @param {Object} data.players
 * @param {number} data.players.max
 * @param {number} data.players.online
 * @param {Array} data.players.sample
 * @param {number} data.discovered
 * @param {number} data.lastTimeOnline
 * @returns {Promise<object>}
 */
 function setServer(data) {
    client.json.set(`servers:${data.ip}`, '$', data);
}

/**
 * Checks if server is present in database
 * @param {String} server_ip
 * @returns {Promise<boolean>}
 */
function serverExists(server_ip) {
    return client.exists(`servers:${server_ip}`);
}

/**
 * Returns the total number of servers in the database
 * @returns {Promise<object>}
 */
function getServerCount() {
    return client.query(
        Count(
            Documents(
                Collection("servers")
            )
        )
    )
}

/**
 * @param {String} ip 
 * @returns {Promise<object>}
 */
async function getServerByIp(ip) {
    return client.json.get(`servers:${ip}`);
}

/**
 * @param {Object} filters
 * @param {String} filters.version
 * @param {boolean} filters.modded
 * @param {String} filters.min_players
 * @param {number} filters.max_results
 * @param {('RANDOM'|'RECENT'|'PLAYER_COUNT')} filters.sort
 * @param {boolean} filters.reverse
 */
async function getServers(filters) {
    filters = filters || {};
    filters.version = filters.version ? filters.version.toUpperCase() : "";
    filters.reverse = (filters.reverse || false) ? -1 : 1;
    filters.max_results = parseInt(filters.max_results);
    const version_filter = ContainsStr(
                                Select(['data', 'version', 'name'], Var('doc'), ""), 
                                filters.version
                            )
    const player_count_filter = GTE(
                                Select(['data', 'players', 'online'], Var('doc'), null), 
                                filters.min_players
                            )

    let modded_filter =  Equals(Select(['data', 'modded'], Var('doc'), null), true);
    let filter;
    if (filters.version && filters.min_players) {
        console.log("Filtering version and player count")
        filter = And(version_filter,player_count_filter);
    } else if (filters.min_players) {
        console.log("Filtering player count")
        filter = player_count_filter;
    } else if (filters.version) {
        console.log("Filtering version")
        filter = version_filter;
    } else if (filters.modded !== undefined) {
        console.log("Filtering modded");
        if (filters.modded === false) {
            modded_filter = Not(modded_filter);
            console.log("Psartek");
        }
        if (!filter) filter = modded_filter;
        else filter = And(filter, modded_filter);
    } else {
        console.log("No filters")
        filter = false;
    }
    
    let results;

    if (filter) {
        results = await client.query(
            Map(
                Paginate(

                        Filter(
                            Documents(Collection('servers')), 
                            Lambda('x', Let({
                                    doc: Get(Var('x'))
                                }, 
                                filter
                            )
                            )
                        ), { size: filters.max_results || await getServerCount().catch(e => {throw e}) - 1 }
                ), Lambda('x', Get(Var('x')))  
            )
        ).catch(e => {throw e});
    } else {
        results = await client.query(
            Map(
                Paginate(
                    Documents(Collection('servers')),
                    { size: filters.max_results || await getServerCount() - 1 }
                ), Lambda('x', Get(Var('x')))
            )
        , {}).catch(e => {throw e});
    }

    results = results.data.map((server) => server.data);

    switch (filters.sort) {
        case "RANDOM":
            results.sort(() => Math.random() - 0.5);
            break;
        case "RECENT":
            results.sort((a, b) => (b.lastTimeOnline - a.lastTimeOnline) * filters.reverse);
            break;
        case "PLAYER_COUNT":
            results.sort((a, b) => ((b.players || {sample: []}).sample.length - (a.players || {sample: []}).sample.length) * filters.reverse);
            break;
    }
    return results;
}

/**
 * Adds player to the player list
 * @param {Object} data
 * @param {String} data.id
 * @param {String} data.name
 * @param {Array<{ip: String, lastTimeOnline: number}>} data.serversPlayed
 * @returns {Promise<object>}
 */
 function setPlayer(data) {
    return client.json.set(`players:${data.id}`, '$', data);
}

/**
 * Checks if a player uuid is present in database
 * @param {String} player_id
 * @returns {Promise<boolean>}
 */
function playerIdExists(player_id) {
    return client.exists(player_id);
}

/**
 * Gets player data from database
 * @param {String} player_id 
 * @returns {Promise<object>} Player data is in the root data property
 */
async function getPlayerData(player_id) {
    return client.json.get(`players:${player_id}`);
}

/**
 * 
 * @returns {Promise<object>}
 */
async function getPlayers() {
    let players = await client.query(
        Map(
            Paginate(
                Documents(Collection("players")),
                { size: await getServerCount() - 1 }
            ), Lambda('x', Get(Var('x')))
        )
    ).catch(e => {throw e});
    return players.data.map((player) => player.data);
}

/**
 * Returns the total number of players in the database
 * @returns {Promise<object>}
 */
function getPlayerCount() {
    return client.query(
        Count(
            Documents(
                Collection("players")
            )
        )
    )
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
    getPlayers: getPlayers
}