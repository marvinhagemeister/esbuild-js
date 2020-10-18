import { Token } from "../../tokens";

export const source = "[x * 1]";
export const serialized = "[x * 1];\n";
export const tokens = [
	Token.OpenBracket,
	Token.Identifier,
	Token["*"],
	Token.NumericLiteral,
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
						type: "BinaryExpression",
						left: { type: "Identifier", name: "x", start: 0, end: 2 },
						right: {
							type: "NumericLiteral",
							value: 1,
							raw: "1",
							start: 0,
							end: 2,
						},
						operator: "*",
						start: 0,
						end: 2,
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
