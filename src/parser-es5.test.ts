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

		it("should parse member expressions", () => {
			expectPrinted("a.b", "a.b;\n");
			expectPrinted("a.b.c", "a.b.c;\n");
		});
	});

	describe("while", () => {
		it("should parse while-loop", () => {
			expectPrinted("while (true) {}", "while (true) {}\n");
			expectPrinted(
				"while (item = foo) { x = 3; }",
				"while (item = foo) {\n  x = 3;\n}\n"
			);
		});
	});

	describe("Functions", () => {
		it("should parse return keyword", () => {
			expectPrinted(
				"function foo() { return 1; }",
				"function foo() {\n  return 1;\n}\n"
			);
		});
	});

	describe("RegExp", () => {
		it("should parse RegExp without flags", () => {
			expectPrinted("/foo/", "/foo/;\n");
		});

		it("should parse RegExp with flags", () => {
			expectPrinted("/foo/i", "/foo/i;\n");
			expectPrinted("/foo/im", "/foo/im;\n");
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

	describe("Comments", () => {
		it("should parse single line comment", () => {
			expectPrinted("// foo", "// foo\n");
			expectPrinted("// foo\nx = 2", "// foo\nx = 2;\n");
		});

		it("should parse multiline comment", () => {
			expectPrinted("/* foo */", "/* foo */\n");
			expectPrinted(
				"/**\n * foo\n * bar\n **/x = 2",
				"/**\n * foo\n * bar\n **/\nx = 2;\n"
			);
		});
	});
});
