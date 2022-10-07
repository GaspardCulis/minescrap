const faunadb = require("faunadb");
const { Update } = require("faunadb");
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
    Join,
    Count,
    Documents
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

module.exports = {
    serverExists: serverExists,
    updateServerData: updateServerData,
    addServer: addServer,
    getServerCount: getServerCount,
    playerIdExists: playerIdExists,
    addPlayer: addPlayer,
    getPlayerData: getPlayerData
}