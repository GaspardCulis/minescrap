import { Masscan } from "node-masscan";
import { getStatus } from "mc-server-status";
import yargs from "yargs/yargs";
import clc from "cli-color";
import Supabase from "./db/Supabase";
import { exit } from "yargs";
import { ServerData } from "./types/database";
import AbstractDatabase from "./db/AstractDatabase";

require("dotenv").config();

const argv = yargs(process.argv.slice(2))
	.option("rate", {
		alias: "r",
		description: "The masscan max rate",
		type: "number",
	})
	.option("verbose", {
		alias: "v",
		description: "Verbose new server data",
		type: "boolean",
	})
	.help()
	.alias("help", "h")
	.parseSync();

/* ------------------------------------------- */
/*	  EDIT THIS FIELD TO MATCH YOUR DATABASE   */
/* ------------------------------------------- */
const database: AbstractDatabase = new Supabase(
	process.env.SUPABASE_URL!,
	process.env.SUPABASE_KEY!
);
// Add your own database by extending AbstractDatabase

function print(msg: string) {
	if (argv.verbose) {
		console.log(msg);
	}
}

async function onServerFound(data: ServerData) {
	let server_exists = await database.serverExists(data.ip).catch((e) => {
		throw e;
	});
	// First checking players
	let players = (data.players ? data.players : {}).sample || [];
	players = players.filter(
		(p) => p && p.id && p.id.length > 10 && p.name && !p.name.startsWith("§")
	);

	if (players.length > 0) {
		print(
			"\t╘═► Players online: " +
				players.map((p) => clc.yellowBright((p || {}).name)).join(", ")
		);
	}
	players.forEach(async (player) => {
		let player_exists = await database.playerIdExists(player.id).catch((e) => {
			throw e;
		});
		if (!player_exists) {
			player.serversPlayed = [data.ip];
			database.addPlayer(player).catch((e) => {
				throw e;
			});
		} else {
			let player_data = await database.getPlayerById(player.id).catch((e) => {
				throw e;
			});
			player_data.name = player.name;
			let server_index = player_data.serversPlayed.findIndex((s) => s == data.ip);
			if (server_index == -1) {
				player_data.serversPlayed.push(data.ip);
				if (player.name != "Anonymous Player") {
					print(
						`\t${clc.magenta.underline("[RARE]")} ${clc.yellowBright(
							player.name
						)} is a fancy boy he plays on ${clc.redBright(
							player_data.serversPlayed.join(", ")
						)}`
					);
				}
			}
			database.updatePlayer(player_data).catch((e) => {
				throw e;
			});
		}
	});

	// Then update server data
	let online = (data.players || {}).online;
	if (server_exists) {
		print("\t╘═► Server already exists, updating lastTimeOnline");
		let oldData = await database.getServerByIp(data.ip).catch((e) => {
			throw e;
		});
		for (let player of players) {
			if (!oldData.players.sample.some((p) => p.id === player.id)) {
				oldData.players.sample.push(player);
				print(
					`\t╘═► ${clc.yellowBright(
						player.name
					)} is a new player on that server (${clc.blackBright(player.id)})`
				);
			}
		}

		oldData.players.max =
			(data.players ? data.players : {}).max || oldData.players.max;
		oldData.players.online =
			online !== undefined ? online : oldData.players.online;

		database.updateServer({
			ip: data.ip,
			description:
				typeof data.description == "string"
					? data.description
					: JSON.stringify(data.description),
			version: {
				name: (data.version ? data.version : {}).name || oldData.version.name,
				protocol:
					(data.version ? data.version : {}).protocol ||
					oldData.version.protocol,
			},
			modded: data.modded,
			allowCrack: oldData.allowCrack,
			whitelist: oldData.whitelist,
			players: oldData.players,
			discovered: new Date(),
			lastTimeOnline: new Date(),
		}).catch((e) => {
			throw e;
		});
	} else {
		database.addServer({
			ip: data.ip,
			description:
				typeof data.description == "string"
					? data.description
					: JSON.stringify(data.description),
			version: {
				name: (data.version ? data.version : {}).name || undefined,
				protocol: (data.version ? data.version : {}).protocol || undefined,
			},
			modded: data.modded,
			allowCrack: undefined,
			whitelist: undefined,
			players: {
				sample: players,
				max: (data.players ? data.players : {}).max || undefined,
				online: online !== undefined ? online : undefined,
			},
			discovered: new Date(),
			lastTimeOnline: new Date(),
		}).catch((e) => {
			throw e;
		});
	}
}

const masscan = new Masscan(process.env.MASSCAN_PATH);

masscan.on("found", async (ip: string, ports: number) => {
	await getStatus(ip, 25565, { timeout: 5000 })
		.then((response) => {
			print(
				`Found : ${clc.redBright(ip)} on port ${ports}   |   rate=${
					masscan.rate
				} percentage=${masscan.percentage}%`
			);
			onServerFound({
				ip,
				description: response.description,
				version: response.version,
				modded: !!(
					(response as any).forgeData ||
					(response as any).modinfo ||
					(response as any).modpackData
				),
				players: response.players as any,
			}).catch((e) => {
				console.error(e);
				throw e;
			});
		})
		.catch((reason) => {});
});

masscan.on("error", (msg: string) => {
	console.log(msg);
});

masscan.on("complete", () => {
	console.log(clc.greenBright("Congrats, you scanned the entire internet !"));
	exit(0, new Error("scan_complete"));
});

masscan.start(
	"0.0.0.0/0",
	"25565",
	argv.rate ? argv.rate : 10000,
	"data/exclude.conf"
);
