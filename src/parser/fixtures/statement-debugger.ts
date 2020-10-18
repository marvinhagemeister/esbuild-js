import { Token } from "../../tokens";

export const source = "debugger;";
export const serialized = "debugger;\n";
export const tokens = [Token.Debugger];
export const ast = {
	type: "Program",
	sourceType: "module",
	body: [
		{
			type: "DebuggerStatement",
			end: 8,
			start: 0,
		},
	],
	hashbang: null,
	start: 0,
	end: 8,
};