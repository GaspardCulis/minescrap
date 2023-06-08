export type PlayerData = {
	id: string;
	name: string;
	serversPlayed: string[];
	discovered: Date;
	lastTimeOnline: Date;
};

export type ServerData = {
	ip: string;
	description: string;
	version: {
		name?: string;
		protocol?: number;
	};
	modded?: boolean;
	allowCrack?: boolean;
	whitelist?: boolean;
	discovered?: Date;
	lastTimeOnline?: Date;
	players: {
		sample: PlayerData[];
		online?: number;
		max?: number;
	};
};
