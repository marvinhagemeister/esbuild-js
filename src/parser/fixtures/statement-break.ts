import { Token } from "../../tokens";

export const source = "break;";
export const serialized = "break;\n";
export const tokens = [Token.Break];
export const ast = {
	type: "Program",
	sourceType: "module",
	body: [
		{
			type: "BreakStatement",
			name: null,
			end: 5,
			start: 0,
		},
	],
	hashbang: null,
	start: 0,
	end: 5,
};
