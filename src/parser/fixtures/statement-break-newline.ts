import { Token } from "../../tokens";

export const source = "break\nfoo;";
export const serialized = "break; foo;\n";
export const tokens = [Token.Break, Token.Identifier];
export const ast = {
	type: "Program",
	sourceType: "module",
	body: [
		{
			type: "BreakStatement",
			end: 10,
			name: {
				type: "Identifier",
				name: "foo",
				start: 7,
				end: 10,
			},
			start: 0,
		},
	],
	hashbang: null,
	start: 0,
	end: 10,
};
