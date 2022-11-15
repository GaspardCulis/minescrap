# minescrap

A minecraft server finder inspired by Copenheimer.

*hippity hoppity, your server's ip is now my property*

Features :
----------
- ⚡️ Fast , uses masscan to scan IPs and  Redis to store found servers.
- 🌐 Express API to query found servers and players with a wide variety of filters.
- 🎨 Fancy colored command line outputs.

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
