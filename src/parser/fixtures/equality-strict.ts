import { Token } from "../../tokens";

export const source = "x === y";
export const serialized = "x === y;\n";
export const tokens = [Token.Identifier, Token["==="], Token.Identifier];
export const ast = {
	type: "Program",
	sourceType: "module",
	body: [
		{
			type: "ExpressionStatement",
			expression: {
				type: "BinaryExpression",
				left: {
					type: "Identifier",
					name: "x",
					start: 0,
					end: 1,
				},
				end: 7,
				operator: "===",
				right: {
					type: "Identifier",
					name: "y",
					start: 6,
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
