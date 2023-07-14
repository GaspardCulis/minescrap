<div align="center">
<h1>Minescrap</h1>

![MinescrapStats](https://dffgmelmvcyznupdsevg.supabase.co/functions/v1/stats?)
  
A minecraft server finder inspired by Copenheimer.

*hippity hoppity, your server's ip is now my property*

</div>

Features :
----------
- ⚡️ Fast , uses masscan to scan IPs in real-time.
- 🌐 Express API to query found servers and players with a wide variety of filters.
- 🗃️ Multi database support to store found servers.
- 🎨 Fancy colored command line outputs.

Installation & Setup :
----------------------

```bash
git clone https://github.com/GaspardCulis/minescrap.git
cd minescrap
npm i
```

### Setup database

Supported databases:
- [![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
- [![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/) (soon)

First choose your DB by editing [src/search.ts](./src/search.ts?plain=1#L31), currently defaults to Supabase.

Then edit the fields corresponding to your database in [.env.example](.env.example) and rename it to .env to setup your database credentials.

Usage :
-------
### Run a search :

`npx ts-node src/search.ts -v`


#### Command line arguments :
- `-v` Verbose found servers info.
- `-r number` The masscan max packet per second rate, defaults to 10000pps.
<br>

### Run the api :

`npx ts-node src/api.ts`

#### Base url :
`http://localhost:6969`

All of the API routes are given in the base URL page.### Web interface

### Web interface

I made a simple web app that displays the found servers and players count in real time. I plan to add a feature to search for servers.
