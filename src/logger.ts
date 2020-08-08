export interface Logger {
	logs: Message[];
}

export interface Message {
	kind: "error";
	text: string;
	location: number;
}

export function addError(
	logger: Logger,
	source: any,
	loc: number,
	text: string
) {
	logger.logs.push({
		kind: "error",
		text,
		location: loc, // TODO locationOrNil
	});
}
