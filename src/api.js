const express = require('express');
const database = require("./database");

const PORT = 6969
const app = express()
app.set('json spaces', 2)

app.get('/servers', async (req, res) => {
    let t0 = Date.now();
    if (req.modded) {
        req.modded = req.modded == "true";
    }
    let servers = await database.getServers(req.query);
    res.json(servers);
    console.log(`[GET] /servers?${JSON.stringify(req.query)} took ${Date.now() - t0}ms`);
})

app.get('/players', async (req, res) => {
    let t0 = Date.now();
    let players = await database.getPlayers(req.query);
    res.json(players);
    console.log(`[GET] /players took ${Date.now() - t0}ms`);
})


app.get('/', async (req, res) => {
    let t0 = Date.now();
    res.send(`
        <h2>Welcome to minescrap API !</h2><br><br>
        We currently own <strong>${await database.getServerCount()}</strong> servers and know <strong>${await database.getPlayerCount()}</strong> players.
        <br><br>
        <h3>Endpoints</h3>
        <ul>
            <li>
                <div>
                    <h4>/servers</h4>
                    <p>Get a list of servers</p>
                    <p>Method: GET</p>
                    <p>Parameters:</p>
                    <ul>
                        <li>version: string</li>
                        <li>modded: boolean</li>
                        <li>min_players: number</li>
                        <li>max_results: number</li>
                        <li>sort: Enum(RANDOM, RECENT, PLAYER_COUNT)</li>
                        <li>sortAscending: boolean</li>
                    </ul>
                </div>
            </li>
            <li>
                <div>
                    <h4>/players</h4>
                    <p>Get a list of players</p>
                    <p>Method: GET</p>
                </div>
            </li>
        </ul>

    `)
    console.log(`[GET] / took ${Date.now() - t0}ms`);
})


app.listen(PORT, () => console.log(`Example app listening at http://localhost:${PORT}`));
