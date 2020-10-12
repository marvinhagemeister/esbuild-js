import { expectPrinted } from "./test-helpers";

describe("ES5", () => {
	describe("Expressions", () => {
		it("should parse equality", () => {
			expectPrinted("1 == 2", "1 == 2;\n");
			expectPrinted("1 != 2", "1 != 2;\n");
			expectPrinted("1 === 2", "1 === 2;\n");
			expectPrinted("1 !== 2", "1 !== 2;\n");
		});

		it("should parse comparisons", () => {
			expectPrinted("1 < 2", "1 < 2;\n");
			expectPrinted("1 <= 2", "1 <= 2;\n");
			expectPrinted("1 > 2", "1 > 2;\n");
			expectPrinted("1 >= 2", "1 >= 2;\n");
		});

		it("should parse logical operators", () => {
			expectPrinted("1 || 2", "1 || 2;\n");
			expectPrinted("1 && 2", "1 && 2;\n");
		});

		it("should parse mixed examples", () => {
			expectPrinted("true || x > 1", "true || x > 1;\n");
			expectPrinted("true || (x > 1 && x < 0)", "true || (x > 1 && x < 0);\n");
		});
	});

	describe("Statements", () => {
		describe("If-Statements", () => {
			it("should parse if-statments", () => {
				expectPrinted("if (true) {}", "if (true) {\n}\n");
				expectPrinted("if (x == 2) {}", "if (x == 2) {\n}\n");
				expectPrinted("if (x == 2) { x = 3; }", "if (x == 2) {\n  x = 3;\n}\n");
			});

			it("should parse if-else statement", () => {
				expectPrinted("if (true) {} else {}", "if (true) {\n} else {\n}\n");
			});

			it("should parse if-else-if-else statement", () => {
				expectPrinted(
					"if (true) {} else if (x > 1) {} else {}",
					"if (true) {\n} else if (x > 1) {\n} else {\n}\n"
				);
			});
		});
	});
});
