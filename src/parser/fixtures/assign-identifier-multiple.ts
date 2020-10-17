export const source = "x = y = z";
export const serialized = "x = y = z;\n";
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
				end: 9,
				operator: "=",
				right: {
					type: "AssignmentExpression",
					left: {
						type: "Identifier",
						name: "y",
						start: 4,
						end: 5,
					},
					operator: "=",
					right: {
						type: "Identifier",
						name: "z",
						start: 8,
						end: 9,
					},
					start: 4,
					end: 9,
				},
				start: 0,
			},
			end: 9,
			start: 0,
		},
	],
	hashbang: null,
	start: 0,
	end: 9,
};
