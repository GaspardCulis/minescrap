const {Masscan} = require("./masscan-node");
const status = require("mc-server-status")
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
    ).catch(e => console.log);
    if(serverExists) {
        client.query(
            Update(
                Select("ref"),
                Get(
                    Match(Index("servers_by_ip"), data.ip)
                ),
                {
                    data: {lastTimeOnline: Date.now()}
                }
            )
        ).catch(e => console.log);
    } else {
        data.discovered = Date.now();
        data.lastTimeOnline = data.discovered;
        client.query(
            Create(
                Collection("servers"),
                {data: data}
            )
        ).catch(e => console.log);
    }
}


masscan.on("found", async (ip, ports) => {
    status.getStatus(ip, 25565).then((response) => {
        response.ip = ip;
        response.favicon = undefined;
        response.ping = undefined;
        console.log(`Found : ${ip} on port ${ports}`);
        console.log(response);
        onServerFound(response);
    }).catch();
})

masscan.start("0.0.0.0/0", "25565", 10000, "data/exclude.conf");
