import { Token } from "../../tokens";

export const source = 'x = "1"';
export const serialized = 'x = "1";\n';
export const tokens = [Token.Identifier, Token["="], Token.StringLiteral];
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
				end: 7,
				operator: "=",
				right: {
					type: "Literal",
					value: "1",
					raw: '"1"',
					start: 4,
					end: 7,
				},
				start: 0,
			},
			end: 7,
			start: 0,
		},
	],
	hashbang: null,
	start: 0,
	end: 7,
};
