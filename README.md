# minescrap

A minecraft server finder inspired by Copenheimer.

*hippity hoppity, your server's ip is now my property*

Features :
----------
- ⚡️ Fast , uses masscan to scan IPs and  Redis to store found servers.
- 🌐 Express API to query found servers and players with a wide variety of filters.
- 🎨 Fancy colored command line outputs.

Installation & Setup :
----------------------

```bash
git clone https://github.com/GaspardCulis/minescrap.git
cd minescrap
npm i
```

You'll need a Redis database with RedisJSON and RediSearch modules installed.

Edit and rename the [.env.example](.env.example) to .env to setup the Redis URL and credentials.

Usage :
-------
### Run a search :

`node src/search.js`


#### Command line arguments :
- `-v` Verbose found servers info.
- `-r number` The masscan max packet per second rate, defaults to 10000pps.
<br>

### Run the api :

`node src/api.js`

#### Base url :
`http://localhost:6969`

All of the API routes are given in the base URL page.
