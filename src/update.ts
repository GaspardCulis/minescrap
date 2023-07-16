import { createClient } from "@supabase/supabase-js";
import { Database } from "./types/supabase";
import { quickConnect, connectSession } from "./quick-connect";
import dotenv from "dotenv";

dotenv.config();

const client = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_KEY!
);

async function* iterateServerBatch(batch_size: number) {
    const server_count = (await client
        .from("servers")
        .select("*", { count: "exact", head: true })).count as number;

    for (let i = 0; i < server_count; i += batch_size) {
        yield await client
            .from("random_servers")
            .select("*")
            .range(i, i + batch_size - 1);
    }
}

async function main() {
    await connectSession();
    for await (const batch of iterateServerBatch(10)) {
        // Run quick connect on each server in the batch
        const results = await Promise.all(
            batch.data!.map(async (server) => {
                return {
                    ip: server.ip,
                    ...await quickConnect(server.ip!)
                };
            })
        );
        // Update the database with the results
        await Promise.all(
            results.map(async (result) => {
                // Some logging
                if (result.online_mode !== null && !result.whitelist) {
                    console.log(`Managed to connect to ${result.ip} with online mode ${result.online_mode}`);
                }
                // Update the database
                await client
                    .from("servers")
                    .update({
                        online_mode: result.online_mode,
                        modded: result.modded,
                        whitelist: result.whitelist,
                        last_time_online: new Date().toISOString()
                    })
                    .eq("ip", result.ip);
            })
        );
    }
}

main();