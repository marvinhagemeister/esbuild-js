import { Token } from "../../tokens";

export const source = "x = ((y)) = z";
export const serialized = "x = y = z;\n";
export const tokens = [
	Token.Identifier,
	Token["="],
	Token.OpenParen,
	Token.OpenParen,
	Token.Identifier,
	Token.CloseParen,
	Token.CloseParen,
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
					type: "Identifier",
					name: "x",
					start: 0,
					end: 1,
				},
				end: 5,
				operator: "=",
				right: {
					type: "AssignmentExpression",
					left: {
						type: "Identifier",
						name: "y",
						start: 4,
						end: 5,
					},
					right: {
						type: "Identifier",
						name: "z",
						start: 0,
						end: 0,
					},
					operator: "=",
					start: 0,
					end: 0,
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
