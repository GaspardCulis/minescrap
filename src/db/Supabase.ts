import { PlayerData, ServerData } from "../types/database";
import { Database } from "../types/supabase";
import AbstractDatabase from "./AstractDatabase";
import { SupabaseClient, createClient } from "@supabase/supabase-js";

export default class Supabase extends AbstractDatabase {
	private client: SupabaseClient<Database>;

	constructor(url: string, key: string) {
		super();
		this.client = createClient<Database>(url, key);
	}

	async addServer(data: ServerData): Promise<void> {
		await this.client.from("servers").insert({
			ip: data.ip,
			description: data.description,
			version: data.version.name,
			protocol: data.version.protocol,
			modded: data.modded,
			max_players: data.players.max,
			online_count: data.players.online,
			players: data.players.sample.map((p) => p.id),
		});
	}

	async updateServer(data: ServerData): Promise<void> {
		await this.client.from("servers").update({
			ip: data.ip,
			description: data.description,
			version: data.version.name,
			protocol: data.version.protocol,
			modded: data.modded,
			max_players: data.players.max,
			online_count: data.players.online,
			players: data.players.sample.map((p) => p.id),
			last_time_online: new Date().toISOString(),
		}).eq("ip", data.ip);
	}

	async serverExists(server_ip: string): Promise<boolean> {
		return (
			(await this.client.from("servers").select("*", { count: 'exact', head: true }).eq("ip", server_ip)).count! >
			0
		);
	}

	async getServerCount(): Promise<number> {
		return (
			await this.client
				.from("servers")
				.select("*", { count: "exact", head: true })
		).count as number;
	}

	async getServerByIp(ip: string): Promise<ServerData> {
		const result = await this.client.from("servers").select().eq("ip", ip).single();
		if (result.error) {
			throw result.error;
		} else if (!result.data) {
			throw Error(`Server ${ip} not found`);
		}
		return this.DBServerToLocal(result.data);
	}

	async getServers(filters: {
		version?: string;
		modded?: boolean;
		min_players?: number;
		max_results?: number;
		sort?: "RANDOM" | "RECENT" | "PLAYER_COUNT";
		reverse?: number | boolean;
		ip?: string;
	}): Promise<ServerData[]> {
		filters = filters || {};
		filters.sort = filters.sort || undefined;
		filters.reverse = filters.reverse || false ? -1 : 1;

		if (filters.ip) {
			return [await this.getServerByIp(filters.ip)];
		}

		let query = this.client
			.from("servers")
			.select()
			.gte("online_count", filters.min_players || 0);

		if (filters.version)
			query = query.textSearch("version", `*${filters.version}*`);
		if (filters.modded !== undefined) {
			query = query.eq("modded", !!filters.modded);
		}

		if (filters.max_results) query = query.limit(filters.max_results);

		const results = (await query).data!;

		switch (filters.sort) {
			case "RANDOM":
				results.sort(() => Math.random() - 0.5);
				break;
			case "RECENT":
				results.sort(
					(a, b) =>
						(new Date(b.last_time_online).getTime() -
							new Date(a.last_time_online).getTime()) *
						(filters.reverse as number)
				);
				break;
			case "PLAYER_COUNT":
				results.sort(
					(a, b) =>
						(b.players.length - a.players.length) * (filters.reverse as number)
				);
				break;
		}

		return await Promise.all(results.map((r) => this.DBServerToLocal(r)));
	}

	async addPlayer(data: PlayerData): Promise<void> {
		await this.client.from("players").insert({
			id: data.id,
			name: data.name,
			servers_played: data.serversPlayed,
		});
	}

	async updatePlayer(data: PlayerData): Promise<void> {
		await this.client.from("players").update({
			id: data.id,
			name: data.name,
			servers_played: data.serversPlayed,
			last_time_online: new Date().toISOString(),
		}).eq("id", data.id);
	}

	async playerIdExists(player_id: string): Promise<boolean> {
		return (
			(await this.client.from("players").select("*", { count: 'exact', head: true }).eq("id", player_id)).count! >
			0
		);
	}

	async getPlayerById(player_id: string): Promise<PlayerData> {
		const result = await this.client.from("players").select().eq("id", player_id).single();
		if (result.error) {
			throw result.error;
		} else if (!result.data) {
			throw Error(`Player ${player_id} not found`);
		}
		return this.DBPlayerToLocal(result.data);
	}

	async getPlayers(filters: {
		uuid: string;
		username: string;
	}): Promise<PlayerData[]> {
		if (filters.uuid) {
			return [await this.getPlayerById(filters.uuid)];
		}
		let query = this.client.from("players").select();
		if (filters.username) {
			query = query.textSearch("name", filters.username);
		}
		return (await query).data!.map((r) => this.DBPlayerToLocal(r));
	}
	async getPlayerCount(): Promise<number> {
		return (
			await this.client
				.from("players")
				.select("*", { count: "exact", head: true })
		).count as number;
	}

	private async DBServerToLocal(
		data: Database["public"]["Tables"]["servers"]["Row"]
	): Promise<ServerData> {
		return {
			ip: data.ip,
			description: data.description,
			version: {
				name: data.version || undefined,
				protocol: data.protocol || undefined,
			},
			modded: data.modded || undefined,
			discovered: new Date(data.discovered),
			lastTimeOnline: new Date(data.last_time_online),
			players: {
				sample: (await Promise.all(
					data.players.map((p) => this.getPlayerById(p).catch((e) => {
						console.log(`Player ${p} not found`);
						console.error(e);
						return null;
					}
					))
				)).filter((p) => p) as PlayerData[],
				online: data.online_count || undefined,
				max: data.max_players || undefined,
			},
		};
	}

	private DBPlayerToLocal(
		data: Database["public"]["Tables"]["players"]["Row"]
	): PlayerData {
		return {
			id: data.id,
			name: data.name,
			serversPlayed: data.servers_played,
			discovered: new Date(data.discovered),
			lastTimeOnline: new Date(data.last_time_online),
		};
	}
}
