import { createLexer, step } from "./core";
import expect from "expect";
import { Token } from "../tokens";
import { scanStringLiteral } from "./string";

function lex(code: string) {
	const lexer = createLexer(code);
	step(lexer);
	scanStringLiteral(lexer);
	return lexer;
}

function expectString(code: string, str: string) {
	const lexer = lex(code);
	expect(lexer.token).toEqual(Token.StringLiteral);
	expect(lexer.string).toEqual(str);
}

function expectTemplate(code: string, str: string) {
	const lexer = lex(code);
	expect(lexer.token).toEqual(Token.TemplateHead);
	expect(lexer.string).toEqual(str);
}

describe("Lex StringLiteral", () => {
	it("should parse simple string literals", () => {
		expectString("'bar'", "bar");
		expectString('"foo"', "foo");
	});

	it("should throw if unterminated", () => {
		expect(() => lex('"foo')).toThrowError(SyntaxError as any);
	});

	it("should throw on newline characters", () => {
		expect(() => lex('"foo\nbar"')).toThrowError(SyntaxError as any);
	});

	describe("Template Strings", () => {
		it("should parse template string", () => {
			expectTemplate("`foo`", "foo");
		});

		it("should only parse template start", () => {
			expectTemplate("`foo${1}`", "foo");
		});
	});
});
