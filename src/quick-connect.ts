import mp, { ClientOptions } from "minecraft-protocol";
import { Database } from "./types/supabase";
import { SupabaseClient } from "@supabase/supabase-js";
const { createClient } = require('@supabase/supabase-js')


require("dotenv").config();

type ConnectResult = "success" | "whitelist" | "crack" | "forge" | "unknown";

type ServerParamsEstimation = {
    online_mode: boolean | null,
    whitelist: boolean | null,
    modded: boolean | null
}

let session: ClientOptions["session"] = undefined;

export function connectSession(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const onlineClient = mp.createClient({
            "username": process.env.MC_USERNAME!,
            "auth": "microsoft",
            connect: () => { }
        });

        onlineClient.on("session", (s) => {
            session = s;
            resolve();
        });

        onlineClient.on("error", (e) => {
            reject(e);
        })
    });
}

function getConnectResult(client: mp.Client, timeout = 5000): Promise<ConnectResult> {
    return new Promise<ConnectResult>((resolve, reject) => {
        client.on("packet", (data, meta) => {
            if (meta.name == "disconnect" && meta.state == "login") {
                if (data.reason.includes("whitelisted")) {
                    resolve("whitelist");
                } else if (data.reason.includes("unverified_username")) {
                    resolve("crack");
                } else if (data.reason.includes(" mods ")) {
                    resolve("forge");
                } else {
                    resolve("unknown");
                }
            } else if (meta.name == "success" && meta.state == "login") {
                resolve("success");
            } else if (meta.name == "kick_disconnect" && meta.state == "play") {
                resolve("unknown");
            }
        });

        client.on("error", (error) => {
            //console.error(error);
            resolve("unknown");
        });

        setTimeout(() => {
            resolve("unknown");
        }, timeout);
    })
}

export async function quickConnect(ip: string, port = 25565): Promise<ServerParamsEstimation> {
    const out: ServerParamsEstimation = {
        whitelist: null,
        online_mode: null,
        modded: null
    }

    const onlineClient = mp.createClient({
        "username": process.env.MC_USERNAME!,
        "auth": "microsoft",
        "session": session,
        host: ip,
        port: port,
        closeTimeout: 10 * 1000,
        keepAlive: false
    });

    let result = await getConnectResult(onlineClient);

    onlineClient.end("quit");

    if (result == "success" || result == "whitelist") {
        out.whitelist = result == "whitelist";
        out.online_mode = result == "success" ? true : null;
        out.modded = false;

        await new Promise(resolve => setTimeout(resolve, 5000));

        const offlineClient = mp.createClient({
            "username": process.env.MC_OFFLINE_USERNAME || "minescrap",
            host: ip,
            port: port,
            closeTimeout: 10 * 1000,
            keepAlive: false
        });

        result = await getConnectResult(offlineClient);

        offlineClient.end("quit");

        out.online_mode = result == "crack" ? true : (result == "success" ? false : null);
    } else if (result == "forge") {
        out.modded = true;
    }

    return out;

}