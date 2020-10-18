import { Token } from "../../tokens";

export const source = "[x,,y]";
export const serialized = "[x,,y];\n";
export const tokens = [
	Token.OpenBracket,
	Token.Identifier,
	Token.Comma,
	Token.Comma,
	Token.Identifier,
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
				elements: [
					{
						type: "Identifier",
						name: "x",
						start: 1,
						end: 2,
					},
					null,
					null,
					{
						type: "Identifier",
						name: "y",
						start: 2,
						end: 3,
					},
				],
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
