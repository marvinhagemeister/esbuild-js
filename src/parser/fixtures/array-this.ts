import { Token } from "../../tokens";

export const source = "[this]";
export const serialized = "[this];\n";
export const tokens = [Token.OpenBracket, Token.This, Token.CloseBracket];
export const ast = {
	type: "Program",
	sourceType: "module",
	body: [
		{
			type: "ExpressionStatement",
			expression: {
				type: "ArrayExpression",
				elements: [{ type: "This", start: 0, end: 2 }],
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
