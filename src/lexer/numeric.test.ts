import { createLexer, getRaw, newLexer, step } from "../lexer";
import expect from "expect";
import { Token } from "../tokens";
import { scanNumberLiteral } from "./numeric";

function lex(code: string) {
	const lexer = createLexer(code);
	step(lexer);
	scanNumberLiteral(lexer);
	return lexer;
}

function expectNumber(code: string, n: number) {
	const lexer = lex(code);
	expect(lexer.token).toEqual(Token.NumericLiteral);

	const raw = getRaw(lexer);
	expect(raw).toEqual(code);

	// We don't evaluate numbers at all internally
	if (!raw.includes("_")) {
		expect(Number(raw)).toEqual(n);
	}
}

describe.only("Lexer", () => {
	describe("Numeric", () => {
		it("should discard leading 0", () => {
			expectNumber("000", 0);
			expectNumber("0987", 987);
			expectNumber("01289", 1289);
		});

		it("should scan integers", () => {
			expectNumber("0", 0);
			expectNumber("123", 123);
			expectNumber("999999999", 999999999);
			expectNumber("9999999999", 9999999999);
			expectNumber("99999999999", 99999999999);
			expectNumber("123456789123456789", 123456789123456780);
			expectNumber(
				"123456789123456789" + "0".repeat(128),
				1.2345678912345679e145
			);
		});

		it("should scan floats", () => {
			expectNumber("0987.6543", 987.6543);
		});

		it.skip("should scan base2", () => {
			// TODO
		});
		it.skip("should scan base8", () => {
			// TODO
		});
		it.skip("should scan base16", () => {
			// TODO
		});

		it("should scan with underscore", () => {
			expectNumber("1_000_000", 1_000_000);
		});

		it("should throw if identifier follows immediately after number", () => {
			expect(() => lex("11abc")).toThrowError(SyntaxError as any);
		});
	});
});
