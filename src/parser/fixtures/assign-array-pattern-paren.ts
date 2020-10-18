import { Token } from "../../tokens";

export const source = "[(x)] = y";
export const serialized = "[x] = y;\n";
export const tokens = [
	Token.OpenBracket,
	Token.OpenParen,
	Token.Identifier,
	Token.CloseParen,
	Token.CloseBracket,
	Token["="],
	Token.Identifier,
];
export const ast = {
	type: "Program",
	sourceType: "module",
	body: [
		{
			type: "ExpressionStatement",
			expression: {
				type: "AssignmentExpression",
				left: {
					type: "ArrayPattern",
					elements: [
						{
							type: "Identifier",
							name: "x",
							start: 0,
							end: 1,
						},
					],
					start: 0,
					end: 0,
				},
				end: 5,
				operator: "=",
				right: {
					type: "Identifier",
					name: "y",
					start: 4,
					end: 5,
				},
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
