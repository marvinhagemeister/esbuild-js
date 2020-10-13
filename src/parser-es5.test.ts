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

		describe("MemberExpressions", () => {
			it("should parse property member expressions", () => {
				expectPrinted("a.b", "a.b;\n");
				expectPrinted("a.b.c", "a.b.c;\n");
			});

			it("should parse index member expressions", () => {
				expectPrinted("a[i]", "a[i];\n");
				expectPrinted("a[x || 4]", "a[x || 4];\n");
			});
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

	describe("try/catch", () => {
		it("should parse try/catch-statement", () => {
			expectPrinted("try {} catch(err) {}", "try {\n} catch (err) {\n}\n");
		});

		it("should parse finally-statement", () => {
			expectPrinted("try {} finally {}", "try {\n} finally {\n}\n");
			expectPrinted(
				"try {} catch(err) {} finally {}",
				"try {\n} catch (err) {\n} finally {\n}\n"
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

		it("should parse function calls", () => {
			expectPrinted("foo()", "foo();\n");
			expectPrinted("foo(1)", "foo(1);\n");
			expectPrinted("foo(x, 1)", "foo(x, 1);\n");
		});

		it("should parse new calls", () => {
			expectPrinted("new foo()", "new foo();\n");
			expectPrinted("new foo(1)", "new foo(1);\n");
			expectPrinted("new foo(x, 1)", "new foo(x, 1);\n");
		});
	});

	describe("Array", () => {
		it("should parse Arrays", () => {
			expectPrinted("[]", "[];\n");
			expectPrinted("[1]", "[1];\n");
			expectPrinted("[1,2]", "[1,2];\n");
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
		it("should parse debugger statement", () => {
			expectPrinted("debugger", "debugger;\n");
		});

		it("should parse throw statement", () => {
			expectPrinted("throw 1", "throw 1;\n");
		});

		it("should parse continue statement", () => {
			expectPrinted("continue", "continue;\n");
			expectPrinted("continue foo", "continue foo;\n");
			expectPrinted(
				"while (true) { continue; }",
				"while (true) {\n  continue;\n}\n"
			);
		});

		it("should parse break statement", () => {
			expectPrinted("break", "break;\n");
			expectPrinted("break foo", "break foo;\n");
			expectPrinted("while (true) { break; }", "while (true) {\n  break;\n}\n");
		});

		it("should parse labels", () => {
			expectPrinted("foo: while (true) {}", "foo:\n  while (true) {}\n");
		});

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
