const express = require('express');
const { query } = require('faunadb');
const database = require("./database");

const PORT = 6969
const app = express()
app.set('json spaces', 2)

app.get('/servers', async (req, res) => {
    console.log(req.query);
    let servers = await database.getServers(req.query);
    res.json(servers);
})

app.get('/players', async (req, res) => {
    let players = await database.getPlayers(req.query);
    res.json(players);
})


app.get('/', async (req, res) => {
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
                        <li>sort: Enum('RANDOM', 'RECENT', 'PLAYER_COUNT')</li>
                        <li>reverse: boolean</li>
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
})


app.listen(PORT, () => console.log(`Example app listening at http://localhost:${PORT}`));
