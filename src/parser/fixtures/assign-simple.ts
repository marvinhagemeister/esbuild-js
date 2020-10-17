export const source = "x = 1";
export const serialized = "x = 1;\n";
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
					type: "Literal",
					value: 1,
					raw: "1",
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
