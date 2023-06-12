import mp from "minecraft-protocol";
import Supabase from "./db/Supabase";

require("dotenv").config();

type ConnectResult = "success" | "whitelist" | "crack" | "unknown"

/*
const onlineClient = mp.createClient({
    "username": process.env.MC_USERNAME!,
    "password": process.env.MC_PASSWORD!,
    "auth": "microsoft"
})*/

export default function quickConnect(ip: string, port = 25565): Promise<ConnectResult> {
    return new Promise<ConnectResult>((resolve, reject) => {
        try {
            const offlineClient = mp.createClient({
                "username": process.env.MC_OFFLINE_USERNAME || "minescrap",
                host: ip,
                port: port
            });
            
            offlineClient.on("packet", (data, meta) => {
                console.log("Packet: ", meta);
                if (meta.name == "disconnect" && meta.state == "login") {
                    if (data.reason.includes("not_whitelisted")) {
                        resolve("whitelist");
                    } else if (data.reason.includes("unverified_username")) {
                        resolve("crack");
                    }
                } else if (meta.name == "success" && meta.state == "login") {
                    offlineClient.end();
                    resolve("success");
                } else if (meta.name == "kick_disconnect" && meta.state == "play") {
                    resolve("unknown");
                }
            });

            offlineClient.on("error", (error) => {
                console.error(error);
                resolve("unknown");
            });

            offlineClient.on("end", (reason) => {
                console.warn("Ended: "+reason);
            });

            offlineClient.on("raw", (buffer) => {
                console.log("Raw");
            })
        } catch {
            resolve("unknown");
        }
    });
}

const database = new Supabase(
	process.env.SUPABASE_URL!,
	process.env.SUPABASE_KEY!
);
async function main() {
    const servers = await database.getServers({
        max_results: 69
    });

    for (const server of servers) {
        const t0 = Date.now();
        console.log(`Server ${server.ip} is ${await quickConnect(server.ip)} (took ${Date.now() - t0}ms)`);
    }
}

main();