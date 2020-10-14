import { expectNumber, expectPrinted } from "./test-helpers";

describe("ES5", () => {
	describe("Numbers", () => {
		it("should parse numbers", () => {
			expectNumber("0", 0);
			expectNumber("000", 0);

			expectNumber("123", 123);
			expectNumber("987", 987);
			expectNumber("0000", 0);

			expectNumber("999999999", 999999999);
			expectNumber("9999999999", 9999999999);
			expectNumber("99999999999", 99999999999);
			expectNumber("123456789123456789", 123456789123456780);
			expectNumber(
				"123456789123456789" + "0".repeat(128),
				1.2345678912345679e145
			);
		});

		it.skip("should parse numbers starting with a dot .5", () => {
			// TODO
		});

		it.skip("should parse octal numbers", () => {
			// expectNumber("010", 8);
			// expectNumber("0123", 83);
			// expectNumber("0123.4567", 83);
			// expectNumber("0987", 987);
			// expectNumber("0987.6543", 987.6543);
			// expectNumber("01289", 1289);
			// expectNumber("01289.345", 1289);
		});

		it.skip("should parse binary numbers", () => {
			// TODO
		});

		it.skip("should parse Hex numbers", () => {
			// TODO
		});
	});

	describe("Expressions", () => {
		it.only("should parse equality", () => {
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

		it("should parse assignment", () => {
			expectPrinted("1 += 2", "1 += 2;\n");
			expectPrinted("1 -= 2", "1 -= 2;\n");
			expectPrinted("1 /= 2", "1 /= 2;\n");
			expectPrinted("1 *= 2", "1 *= 2;\n");
		});

		it("should parse quick math!", () => {
			expectPrinted("1 + 2", "1 + 2;\n");
			expectPrinted("1 - 2", "1 - 2;\n");
			expectPrinted("1 / 2", "1 / 2;\n");
			expectPrinted("1 * 2", "1 * 2;\n");
		});

		it("should parse mixed examples", () => {
			expectPrinted("true || x > 1", "true || x > 1;\n");
			expectPrinted("true || (x > 1 && x < 0)", "true || (x > 1 && x < 0);\n");
		});

		describe("MemberExpressions", () => {
			it("should parse property member expressions", () => {
				expectPrinted("a.b", "a.b;\n");
				expectPrinted("a.b.c", "a.b.c;\n");
				expectPrinted("component.constructor;", "component.constructor;\n");
			});

			it("should parse index member expressions", () => {
				expectPrinted("a[i]", "a[i];\n");
				expectPrinted("a[x || 4]", "a[x || 4];\n");
				expectPrinted("arguments$1[i]", "arguments$1[i];\n");
			});
		});

		it("should parse this", () => {
			expectPrinted("this", "this;\n");
			expectPrinted("this.foo", "this.foo;\n");
		});

		it("should parse ternary expressions (conditional)", () => {
			expectPrinted("a ? b : c", "a\n  ? b\n  : c;\n");
		});
	});

	it("'in'-operator", () => {
		expectPrinted("!(a in b)", "!(a in b);\n");
		expectPrinted("for (a in b) {}", "for (a in b) {\n}\n");
		expectPrinted("a && !(i in newProps)", "a && !(i in newProps);\n");
	});

	describe("while", () => {
		it("should parse while-loop", () => {
			expectPrinted("while (true) {}", "while (true) {\n}\n");
			expectPrinted(
				"while (item = foo) { x = 3; }",
				"while (item = foo) {\n  x = 3;\n}\n"
			);
		});
	});

	describe("try/catch", () => {
		it("should parse try/catch-statement", () => {
			expectPrinted("try {} catch(err) {}", "try {\n}\ncatch (err) {\n}\n\n");
		});

		it("should parse finally-statement", () => {
			expectPrinted("try {} finally {}", "try {\n}\nfinally {\n}\n\n");
			expectPrinted(
				"try {} catch(err) {} finally {}",
				"try {\n}\ncatch (err) {\n}\nfinally {\n}\n\n"
			);
		});
	});

	describe("Functions", () => {
		it("should parse return keyword", () => {
			expectPrinted(
				"function foo() { return; }",
				"function foo() {\n  return;\n}\n\n"
			);
			expectPrinted(
				"function foo() { return 1; }",
				"function foo() {\n  return 1;\n}\n\n"
			);
			expectPrinted(
				"function foo() { if (true) { return foo.bar; } }",
				"function foo() {\n  if (true) {\n    return foo.bar;\n  }\n\n}\n\n"
			);
		});

		it("should parse function calls", () => {
			expectPrinted("foo()", "foo();\n");
			expectPrinted("foo(1)", "foo(1);\n");
			expectPrinted("foo(x, 1)", "foo(x, 1);\n");
			expectPrinted("foo(bar() + 1)", "foo(bar() + 1);\n");
		});

		it("should parse new calls", () => {
			expectPrinted("new foo()", "new foo();\n");
			expectPrinted("new foo(1)", "new foo(1);\n");
			expectPrinted("new foo(x, 1)", "new foo(x, 1);\n");
		});

		it("should parse function expressions", () => {
			// FIXME: Traling newline
			expectPrinted("var a = function() {}", "var a = function() {\n}\n;\n");
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

	describe("Object", () => {
		it("should parse object", () => {
			expectPrinted("a = {}", "a = {};\n");
			// expectPrinted("{ foo: 1 }", "{ foo: 1 };\n");
			// expectPrinted("{ foo: foo }", "{ foo: foo };\n");
		});

		it.skip("should parse shorthand properties", () => {
			expectPrinted("{ foo }", "{ foo };\n");
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
			// FIXME: traling space
			expectPrinted("foo: while (true) {}", "foo:\n  while (true) {\n  }\n");
		});

		describe("If-Statements", () => {
			it("should parse if-statments", () => {
				expectPrinted("if (true) {}", "if (true) {\n}\n\n");
				expectPrinted("if (x == 2) {}", "if (x == 2) {\n}\n\n");
				expectPrinted(
					"if (x == 2) { x = 3; }",
					"if (x == 2) {\n  x = 3;\n}\n\n"
				);
			});

			it("should parse if-else statement", () => {
				expectPrinted("if (true) {} else {}", "if (true) {\n}\nelse {\n}\n\n");
			});

			it("should parse if-else-if-else statement", () => {
				expectPrinted(
					"if (true) {} else if (x > 1) {} else {}",
					"if (true) {\n}\nelse if (x > 1) {\n}\nelse {\n}\n\n"
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
