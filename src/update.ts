import { createClient } from "@supabase/supabase-js";
import { Database } from "./types/supabase";
import { quickConnect, connectSession } from "./quick-connect";
import dotenv from "dotenv";
import yargs from "yargs/yargs";

dotenv.config();

const argv = yargs(process.argv.slice(2))
    .option("batch-size", {
        alias: "b",
        description: "The simultaneous count of servers to check, the higher the faster but more false negatives due to connection errors",
        type: "number",
        default: 10
    })
    .option("verbose", {
        alias: "v",
        description: "Verbose events",
        type: "boolean",
    })
    .help()
    .alias("help", "h")
    .parseSync();

const BATCH_SIZE = argv.batchSize;
const VERBOSE = argv.verbose;

console.log(`Running with batch size ${BATCH_SIZE} and verbose ${VERBOSE}`);

const client = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_KEY!,
    {
        auth: {
            persistSession: false,
        }
    }
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
    let total_tries = 0;
    let connect_count = 0;
    await connectSession();
    for await (const batch of iterateServerBatch(BATCH_SIZE)) {
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
                total_tries += 1;
                // Some logging
                if (result.online_mode !== null && !result.whitelist && VERBOSE) {
                    connect_count += 1;
                    console.log(`[${connect_count}/${total_tries}] Managed to connect to ${result.ip} with online mode ${result.online_mode}`);
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