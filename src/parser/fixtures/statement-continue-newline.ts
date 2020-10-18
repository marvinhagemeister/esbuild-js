import { Token } from "../../tokens";

export const source = "continue\nfoo;";
export const serialized = "continue; foo;\n";
export const tokens = [Token.Continue, Token.Identifier];
export const ast = {
	type: "Program",
	sourceType: "module",
	body: [
		{
			type: "ContinueStatement",
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
