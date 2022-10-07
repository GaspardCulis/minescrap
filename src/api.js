const express = require('express');
const database = require("./database");

const PORT = 6969
const app = express()


app.get('/', async (req, res) => {
    res.send(`
        Welcome to minescrap API !\n\n
        We currently own ${await database.getServerCount()} servers.
    `)
})


app.listen(PORT, () => console.log(`Example app listening at http://localhost:${PORT}`));
