export const source = "x == y";
export const serialized = "x == y;\n";
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
				end: 6,
				operator: "==",
				right: {
					type: "Identifier",
					name: "y",
					start: 5,
					end: 6,
				},
				start: 0,
			},
			end: 6,
			start: 0,
		},
	],
	hashbang: null,
	start: 0,
	end: 6,
};
