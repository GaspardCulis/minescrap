const faunadb = require("faunadb");
const {
    Paginate,
    Get,
    Select,
    Match, 
    Index,
    Create,
    Collection,
    Exists,
    Lambda,
    Var,
    Let,
    Filter,
    Count,
    Documents,
    Map,
    And,
    Update,
    ContainsStr,
    GTE,
    Range
} = faunadb.query;

require('dotenv').config()

const client = new faunadb.Client({secret: process.env.FAUNA_KEY, domain: "db.eu.fauna.com"});

/**
 * Checks if server is present in database
 * @param {String} server_ip
 * @returns {Promise<object>}
 */
async function serverExists(server_ip) {
    return client.query(
        Exists(
            Match(Index('servers_by_ip'), server_ip)
        )
    )
}

/**
 * @param {String} server_ip 
 * @param {Object} data 
 * @returns {Promise<object>}
 */
async function updateServerData(server_ip, data) {
    return client.query(
        Update(          
            Select("ref",
                Get(
                    Match(Index("servers_by_ip"), server_ip)
                ),
            ),
            {
                data: data
            }
        )
    );
}

/**
 * Adds new server to database
 * @param {Object} data 
 * @returns {Promise<object>}
 */
async function addServer(data) {
    return client.query(
        Create(
            Collection("servers"),
            {data: data}
        )
    );
}

/**
 * Returns the total number of servers in the database
 * @returns {Promise<object>}
 */
async function getServerCount() {
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
 * @returns 
 */
async function getServerByIp(ip) {
    return client.query(
        Get(
            Match(Index("servers_by_ip"), ip)
        )
    )
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
    const version_filter = ContainsStr(
                                Select(['data', 'version', 'name'], Var('doc'), null), 
                                filters.version
                            )
    const player_count_filter = GTE(
                                Select(['data', 'players', 'online'], Var('doc'), null), 
                                filters.min_players
                            )

    const modded_filter =  Equals(
                            Select(['data', 'modded'], Var('doc'), null), filters.modded
                        )
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
    } else {
        console.log("No filters")
        filter = false;
    }
    
    let results;

    if (filter) {
        results = await client.query(
            Map(
                Paginate(
                    Range(
                        Filter(
                            Documents(Collection('servers')), 
                            Lambda('x', Let({
                                    doc: Get(Var('x'))
                                }, 
                                And(filter, filters.modded ? modded_filter : (a,b) => true)
                            )
                            )
                        )
                    ), 0, filter.max_results || await getServerCount()
                ), Lambda('x', Get(Var('x')))  
            )
        )
    } else {
        results = await client.query(
            Map(
                Paginate(
                    Documents(Collection('servers'))
                ), Lambda('x', Get(Var('x')))
            )
        , {})
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
            results.sort((a, b) => (b.players.online - a.players.online) * filters.reverse);
            break;
    }
    return results;
}

/**
 * Checks if a player uuid is present in database
 * @param {String} player_id
 * @returns {Promise<object>}
 */
 async function playerIdExists(player_id) {
    return client.query(
        Exists(
            Match(Index('players_by_id'), player_id)
        )
    )
}

/**
 * Gets player data from database
 * @param {String} player_id 
 * @returns @returns {Promise<object>} Player data is in the root data property
 */
async function getPlayerData(player_id) {
    return client.query(
        Get(
            Match(Index("players_by_id"), player_id)
        )
    );
}

/**
 * Adds player to the player list
 * @param {Object} data 
 * @returns {Promise<object>}
 */
async function addPlayer(data) {
    return client.query(
        Create(
            Collection("players"),
            {data: data}
        )
    );
}

/**
 * @param {String} player_id 
 * @param {Object} data 
 * @returns {Promise<object>}
 */
 async function updatePlayerData(player_id, data) {
    return client.query(
        Update(          
            Select("ref",
                Get(
                    Match(Index("players_by_id"), player_id)
                ),
            ),
            {
                data: data
            }
        )
    );
}

/**
 * Returns the total number of players in the database
 * @returns {Promise<object>}
 */
 async function getPlayerCount() {
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
    updateServerData: updateServerData,
    addServer: addServer,
    getServerCount: getServerCount,
    playerIdExists: playerIdExists,
    addPlayer: addPlayer,
    getPlayerData: getPlayerData,
    updatePlayerData: updatePlayerData,
    getPlayerCount: getPlayerCount,
    getServers: getServers,
    getServerByIp: getServerByIp
}