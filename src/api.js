const express = require('express');
const database = require("./database");

const PORT = 6969
const app = express()


app.get('/', async (req, res) => {
    res.send(`
        <strong>Welcome to minescrap API !</strong><br>
        We currently own <strong>${await database.getServerCount()}</strong> servers and know <strong>${await database.getPlayerCount()}</strong> players.
    `)
})


app.listen(PORT, () => console.log(`Example app listening at http://localhost:${PORT}`));
