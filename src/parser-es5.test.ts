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
});
