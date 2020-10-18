import { Token } from "../../tokens";

export const source = "continue foo;";
export const serialized = "continue foo;\n";
export const tokens = [Token.Continue, Token.Identifier];
export const ast = {
	type: "Program",
	sourceType: "module",
	body: [
		{
			type: "ContinueStatement",
			end: 12,
			name: {
				type: "Identifier",
				name: "foo",
				start: 9,
				end: 12,
			},
			start: 0,
		},
	],
	hashbang: null,
	start: 0,
	end: 12,
};
