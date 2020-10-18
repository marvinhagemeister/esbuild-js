import { Token } from "../../tokens";

export const source = "continue;";
export const serialized = "continue;\n";
export const tokens = [Token.Continue];
export const ast = {
	type: "Program",
	sourceType: "module",
	body: [
		{
			type: "ContinueStatement",
			name: null,
			end: 8,
			start: 0,
		},
	],
	hashbang: null,
	start: 0,
	end: 8,
};
