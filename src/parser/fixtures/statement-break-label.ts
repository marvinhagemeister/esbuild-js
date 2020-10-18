import { Token } from "../../tokens";

export const source = "break foo;";
export const serialized = "break foo;\n";
export const tokens = [Token.Break, Token.Identifier];
export const ast = {
	type: "Program",
	sourceType: "module",
	body: [
		{
			type: "BreakStatement",
			end: 9,
			name: {
				type: "Identifier",
				name: "foo",
				start: 6,
				end: 9,
			},
			start: 0,
		},
	],
	hashbang: null,
	start: 0,
	end: 9,
};
