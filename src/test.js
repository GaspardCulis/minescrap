const {Masscan} = require("./masscan-node");
const mcping = require('mc-ping-updated');
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
    Join
} = faunadb.query;
require('dotenv').config()

const client = new faunadb.Client({secret: process.env.FAUNA_KEY, domain: "db.eu.fauna.com"});

let masscan = new Masscan();

async function onServerFound(data) {
    const serverExists = await client.query(
        Exists(
            Match(Index('servers_by_ip'), data.ip)
        )

        .catch(e => console.log)
    );
    if(serverExists) {
        
    } else {
        data.discovered = Date.now();
        data.lastTimeOnline = data.discovered;
        client.query(
            Create(
                Collection("servers"),
                {data: data}
            )
        )
    }
}


masscan.on("found", (ip, ports) => {
    mcping(ip, 25565, (err, response) => {
        if (!err) {
            response.ip = ip;
            response.favicon = undefined;
            console.log(`Found : ${ip} on port ${ports}`);
            onServerFound(response);
        }
    })
})

masscan.start("0.0.0.0/0", "25565", 100000, "data/exclude.conf");
