import { PlayerData, ServerData } from "../types/database";

export default abstract class AbstractDatabase {
	abstract addServer(data: ServerData): Promise<void>;

	abstract updateServer(data: ServerData): Promise<void>;

	abstract serverExists(server_ip: string): Promise<boolean>;

	abstract getServerCount(): Promise<number>;

	abstract getServerByIp(ip: string): Promise<ServerData>;

	abstract getServers(filters: {
		version?: string;
		modded?: boolean;
		min_players?: number;
		max_results?: number;
		sort?: "RANDOM" | "RECENT" | "PLAYER_COUNT";
		reverse?: boolean | number;
		ip?: string;
	}): Promise<Array<ServerData>>;

	abstract addPlayer(data: PlayerData): Promise<void>;

	abstract updatePlayer(data: PlayerData): Promise<void>;

	abstract playerIdExists(player_id: string): Promise<boolean>;

	abstract getPlayerById(player_id: string): Promise<PlayerData>;

	abstract getPlayers(filters: {
		uuid: string;
		username: string;
	}): Promise<PlayerData[]>;

	abstract getPlayerCount(): Promise<number>;
}
