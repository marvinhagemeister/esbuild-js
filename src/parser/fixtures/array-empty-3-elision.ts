import { Token } from "../../tokens";

export const source = "[,,,]";
export const serialized = "[,,,];\n";
export const tokens = [
	Token.OpenBracket,
	Token.Comma,
	Token.Comma,
	Token.Comma,
	Token.CloseBracket,
];
export const ast = {
	type: "Program",
	sourceType: "module",
	body: [
		{
			type: "ExpressionStatement",
			expression: {
				type: "ArrayExpression",
				elements: [null, null, null],
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
