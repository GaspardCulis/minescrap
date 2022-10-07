const express = require('express');
const { query } = require('faunadb');
const database = require("./database");

const PORT = 6969
const app = express()


app.get('/', async (req, res) => {
    res.send(`
        <h2>Welcome to minescrap API !</h2><br><br>
        We currently own <strong>${await database.getServerCount()}</strong> servers and know <strong>${await database.getPlayerCount()}</strong> players.
    `)
})

app.get('/servers', async (req, res) => {
    console.log(req.query);
    req.query.reverse = req.query.reverse ? true : false
    let servers = await database.getServers(req.query);
    res.json(servers);
})


app.listen(PORT, () => console.log(`Example app listening at http://localhost:${PORT}`));
