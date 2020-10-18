import { Token } from "../../tokens";

export const source = "[x]";
export const serialized = "[x];\n";
export const tokens = [Token.OpenBracket, Token.Identifier, Token.CloseBracket];
export const ast = {
	type: "Program",
	sourceType: "module",
	body: [
		{
			type: "ExpressionStatement",
			expression: {
				type: "ArrayExpression",
				elements: [{ type: "Identifier", name: "x", start: 0, end: 2 }],
				end: 5,
				start: 0,
			},
			end: 5,
			start: 0,
		},
	],
	hashbang: null,
	start: 0,
	end: 5,
};
