import { newLexer } from "./lexer";
import { Token } from "./tokens";
import expect from "expect";
import { expectNumber } from "./test-helpers";

function expectIdentifier(input: string, expected: string) {
	const lexer = newLexer(input);
	expect(lexer.identifier).toBe(expected);
	expect(lexer.token).toBe(Token.Identifier);
}

function expectToken(input: string, expected: Token) {
	const lexer = newLexer(input);
	expect(lexer.token).toBe(expected);
}

function expectBigInteger(input: string, expected: number) {
	const lexer = newLexer(input);
	expect(lexer.token).toBe(Token.BigIntLiteral);
	expect(lexer.number).toBe(expected);
}

function expectString(input: string, expected: string) {
	const lexer = newLexer(input);
	expect(lexer.token).toBe(Token.StringLiteral);
	expect(lexer.string).toBe(expected);
}

function expectHashbang(input: string, expected: string) {
	const lexer = newLexer(input);
	expect(lexer.identifier).toBe(expected);
	expect(lexer.token).toBe(Token.Hashbang);
}

function expectLexerError(input: string, typeOrRegex: any) {
	try {
		newLexer(input);
	} catch (err) {
		if (typeOrRegex instanceof RegExp) {
			expect(err.message).toMatch(typeOrRegex);
		} else {
			expect(err).toBeInstanceOf(typeOrRegex as any);
		}
	}
}

describe("lexer", () => {
	it("should parse '('", () => {
		expectToken("(", Token.OpenParen);
	});
	it("should parse ')'", () => {
		expectToken(")", Token.CloseParen);
	});

	it("should parse '['", () => {
		expectToken("[", Token.OpenBracket);
	});
	it("should parse ']'", () => {
		expectToken("]", Token.CloseBracket);
	});

	it("should parse '{'", () => {
		expectToken("{", Token.OpenBrace);
	});
	it("should parse '}'", () => {
		expectToken("}", Token.CloseBrace);
	});

	it("should parse Identifiers", () => {
		expectIdentifier("_", "_");
		expectIdentifier("$", "$");
		expectIdentifier("test", "test");
		// expectIdentifier("t\\u0065st", "test");
		// expectIdentifier("t\\u{65}st", "test");

		// expectLexerError("t\\u.", SyntaxError);
		// expectLexerError("t\\u0.", SyntaxError);
		// expectLexerError("t\\u00.", SyntaxError);
		// expectLexerError("t\\u006.", SyntaxError);
		// expectLexerError("t\\u{.", SyntaxError);
		// expectLexerError("t\\u{0.", SyntaxError);

		// expectIdentifier("a\u200C", "a\u200C");
		// expectIdentifier("a\u200D", "a\u200D");
	});

	it("should parse numbers", () => {
		expectNumber("0", 0);
		expectNumber("000", 0);
		// expectNumber("010", 8);
		expectNumber("123", 123);
		expectNumber("987", 987);
		expectNumber("0000", 0);
		// expectNumber("0123", 83);
		// expectNumber("0123.4567", 83);
		// expectNumber("0987", 987);
		// expectNumber("0987.6543", 987.6543);
		// expectNumber("01289", 1289);
		// expectNumber("01289.345", 1289);
		expectNumber("999999999", 999999999);
		expectNumber("9999999999", 9999999999);
		expectNumber("99999999999", 99999999999);
		expectNumber("123456789123456789", 123456789123456780);
		expectNumber(
			"123456789123456789" + "0".repeat(128),
			1.2345678912345679e145
		);

		// expectNumber("0b00101", 5.0);
		// expectNumber("0B00101", 5.0);
		// expectNumber("0b1011101011101011101011101011101011101", 100352251741.0);
		// expectNumber("0B1011101011101011101011101011101011101", 100352251741.0);
		// expectLexerError("0b", /end of file/);
		// expectLexerError("0B", /end of file/);
		// expectLexerError("0b012", SyntaxError);
		// expectLexerError("0b018", SyntaxError);
		// expectLexerError("0b01a", SyntaxError);
		// expectLexerError("0b01A", SyntaxError);

		// expectNumber("0o12345", 5349.0);
		// expectNumber("0O12345", 5349.0);
		// expectNumber("0o1234567654321", 89755965649.0);
		// expectNumber("0O1234567654321", 89755965649.0);
		// expectLexerError("0o", /end of file/);
		// expectLexerError("0O", /end of file/);
		// expectLexerError("0o018", SyntaxError);
		// expectLexerError("0o01a", SyntaxError);
		// expectLexerError("0o01A", SyntaxError);

		// expectNumber("0x12345678", 0x12345678);
		// expectNumber("0xFEDCBA987", 0xfedcba987);
		// expectNumber("0x000012345678", 0x12345678);
		// expectNumber("0x123456781234", 0x123456781234);
		// expectLexerError("0x", /end of file/);
		// expectLexerError("0X", /end of file/);
		// expectLexerError("0xGFEDCBA", SyntaxError);
		// expectLexerError("0xABCDEFG", SyntaxError);

		// expectNumber("123.", 123.0);
		// expectNumber(".0123", 0.0123);
		// expectNumber("0.0123", 0.0123);
		// expectNumber("2.2250738585072014e-308", 2.2250738585072014e-308);
		// expectNumber("1.7976931348623157e+308", 1.7976931348623157e308);

		// // Underflow
		// expectNumber("4.9406564584124654417656879286822e-324", 5e-324);
		// expectNumber("5e-324", 5e-324);
		// expectNumber("1e-325", 0.0);

		// // Overflow
		// expectNumber(
		// 	"1.797693134862315708145274237317e+308",
		// 	1.7976931348623157e308
		// );
		// expectNumber("1.797693134862315808e+308", Infinity);
		// expectNumber("1e+309", Infinity);

		// // int32
		// expectNumber("0x7fff_ffff", 2147483647.0);
		// expectNumber("0x8000_0000", 2147483648.0);
		// expectNumber("0x8000_0001", 2147483649.0);

		// // uint32
		// expectNumber("0xffff_ffff", 4294967295.0);
		// expectNumber("0x1_0000_0000", 4294967296.0);
		// expectNumber("0x1_0000_0001", 4294967297.0);

		// // int64
		// expectNumber("0x7fff_ffff_ffff_fdff", 9223372036854774784);
		// expectNumber("0x8000_0000_0000_0000", 9.223372036854776e18);
		// expectNumber("0x8000_0000_0000_3000", 9.223372036854788e18);

		// // uint64
		// expectNumber("0xffff_ffff_ffff_fbff", 1.844674407370955e19);
		// expectNumber("0x1_0000_0000_0000_0000", 1.8446744073709552e19);
		// expectNumber("0x1_0000_0000_0000_1000", 1.8446744073709556e19);

		// expectNumber("1.", 1.0);
		// expectNumber(".1", 0.1);
		// expectNumber("1.1", 1.1);
		// expectNumber("1e1", 10.0);
		// expectNumber("1e+1", 10.0);
		// expectNumber("1e-1", 0.1);
		// expectNumber(".1e1", 1.0);
		// expectNumber(".1e+1", 1.0);
		// expectNumber(".1e-1", 0.01);
		// expectNumber("1.e1", 10.0);
		// expectNumber("1.e+1", 10.0);
		// expectNumber("1.e-1", 0.1);
		// expectNumber("1.1e1", 11.0);
		// expectNumber("1.1e+1", 11.0);
		// expectNumber("1.1e-1", 0.11);

		// expectLexerError("1e", /end of file/);
		// expectLexerError(".1e", /end of file/);
		// expectLexerError("1.e", /end of file/);
		// expectLexerError("1.1e", /end of file/);
		// expectLexerError("1e+", /end of file/);
		// expectLexerError(".1e+", /end of file/);
		// expectLexerError("1.e+", /end of file/);
		// expectLexerError("1.1e+", /end of file/);
		// expectLexerError("1e-", /end of file/);
		// expectLexerError(".1e-", /end of file/);
		// expectLexerError("1.e-", /end of file/);
		// expectLexerError("1.1e-", /end of file/);
		// expectLexerError("1e+-1", SyntaxError);
		// expectLexerError("1e-+1", SyntaxError);

		// expectLexerError("1z", SyntaxError);
		// expectLexerError("1.z", SyntaxError);
		// expectLexerError("1.0f", SyntaxError);
		// expectLexerError("0b1z", SyntaxError);
		// expectLexerError("0o1z", SyntaxError);
		// expectLexerError("0x1z", SyntaxError);
		// expectLexerError("1e1z", SyntaxError);

		// expectNumber("1_2_3", 123);
		// expectNumber(".1_2", 0.12);
		// expectNumber("1_2.3_4", 12.34);
		// expectNumber("1e2_3", 1e23);
		// expectNumber("1_2e3_4", 12e34);
		// expectNumber("1_2.3_4e5_6", 12.34e56);
		// expectNumber("0b1_0", 2);
		// expectNumber("0B1_0", 2);
		// expectNumber("0o1_2", 10);
		// expectNumber("0O1_2", 10);
		// expectNumber("0x1_2", 0x12);
		// expectNumber("0X1_2", 0x12);

		// expectLexerError("1__2", SyntaxError);
		// expectLexerError(".1__2", SyntaxError);
		// expectLexerError("1e2__3", SyntaxError);
		// expectLexerError("0b1__0", SyntaxError);
		// expectLexerError("0B1__0", SyntaxError);
		// expectLexerError("0o1__2", SyntaxError);
		// expectLexerError("0O1__2", SyntaxError);
		// expectLexerError("0x1__2", SyntaxError);
		// expectLexerError("0X1__2", SyntaxError);

		// expectLexerError("1_", SyntaxError);
		// expectLexerError("1._", SyntaxError);
		// expectLexerError(".1_", SyntaxError);
		// expectLexerError("1e_", SyntaxError);
		// expectLexerError("1e1_", SyntaxError);
		// expectLexerError("1_e1", SyntaxError);
		// expectLexerError(".1_e1", SyntaxError);
		// expectLexerError("0b_1", SyntaxError);
		// expectLexerError("0B_1", SyntaxError);
		// expectLexerError("0o_1", SyntaxError);
		// expectLexerError("0O_1", SyntaxError);
		// expectLexerError("0x_1", SyntaxError);
		// expectLexerError("0X_1", SyntaxError);
		// expectLexerError("0b1_", SyntaxError);
		// expectLexerError("0B1_", SyntaxError);
		// expectLexerError("0o1_", SyntaxError);
		// expectLexerError("0O1_", SyntaxError);
		// expectLexerError("0x1_", SyntaxError);
		// expectLexerError("0X1_", SyntaxError);
	});

	it.skip("should parse big numbers", () => {
		expectBigInteger("0n", 0);
		expectBigInteger("123n", 123);
		expectBigInteger("9007199254740993n", 9007199254740993); // This can't fit in a float64

		expectBigInteger("0b00101n", 0b00101);
		expectBigInteger("0B00101n", 0b00101);
		expectBigInteger(
			"0b1011101011101011101011101011101011101n",
			0b1011101011101011101011101011101011101
		);
		expectBigInteger(
			"0B1011101011101011101011101011101011101n",
			0b1011101011101011101011101011101011101
		);

		expectBigInteger("0o12345n", 0o12345);
		expectBigInteger("0O12345n", 0o12345);
		expectBigInteger("0o1234567654321n", 0o1234567654321);
		expectBigInteger("0O1234567654321n", 0o1234567654321);

		expectBigInteger("0x12345678n", 0x12345678);
		expectBigInteger("0xFEDCBA987n", 0xfedcba987);
		expectBigInteger("0x000012345678n", 0x000012345678);
		expectBigInteger("0x123456781234n", 0x123456781234);

		expectBigInteger("1_2_3n", 123);
		expectBigInteger("0b1_0_1n", 0b101);
		expectBigInteger("0o1_2_3n", 0o123);
		expectBigInteger("0x1_2_3n", 0x123);

		expectLexerError("1e2n", SyntaxError);
		expectLexerError("1.0n", SyntaxError);
		expectLexerError(".1n", SyntaxError);
		expectLexerError("000n", SyntaxError);
		expectLexerError("0123n", SyntaxError);
		expectLexerError("089n", SyntaxError);
		expectLexerError("0_1n", SyntaxError);
	});

	it("should lex string literals", () => {
		expectString("''", "");
		expectString("'123'", "123");
		// expectString("'\\''", "'");
		// expectString("'\\\"'", '"');
		// expectString("'\\\\'", "\\");
		// expectString("'\\a'", "a");
		// expectString("'\\b'", "\b");
		// expectString("'\\f'", "\f");
		// expectString("'\\n'", "\n");
		// expectString("'\\r'", "\r");
		// expectString("'\\t'", "\t");
		// expectString("'\\v'", "\v");

		// expectString("'\\0'", "\\000");
		// expectString("'\\1'", "\\001");
		// expectString("'\\2'", "\\002");
		// expectString("'\\3'", "\\003");
		// expectString("'\\4'", "\\004");
		// expectString("'\\5'", "\\005");
		// expectString("'\\6'", "\\006");
		// expectString("'\\7'", "\\007");

		// expectString("'\\000'", "\\000");
		// expectString("'\\001'", "\\001");
		// expectString("'\\002'", "\\002");
		// expectString("'\\003'", "\\003");
		// expectString("'\\004'", "\\004");
		// expectString("'\\005'", "\\005");
		// expectString("'\\006'", "\\006");
		// expectString("'\\007'", "\\007");

		// expectString("'\\100'", "\\100");
		// expectString("'\\200'", "\u0080");
		// expectString("'\\300'", "\u00C0");
		// expectString("'\\377'", "\u00FF");
		// expectString("'\\378'", "\\0378");
		// expectString("'\\400'", "\\0400");
		// expectString("'\\500'", "\\0500");
		// expectString("'\\600'", "\\0600");
		// expectString("'\\700'", "\\0700");

		// expectString("'\\x00'", "\x00");
		// expectString("'\\X11'", "X11");
		// expectString("'\\x71'", "\x71");
		// expectString("'\\x7f'", "\x7f");
		// expectString("'\\x7F'", "\x7F");

		// expectString("'\\u0000'", "\u0000");
		// expectString("'\\ucafe\\uCAFE\\u7FFF'", "\ucafe\uCAFE\u7FFF");
		// expectString("'\\uD800'", "\xED\xA0\x80");
		// expectString("'\\uDC00'", "\xED\xB0\x80");
		// expectString("'\\U0000'", "U0000");

		// expectString("'\\u{100000}'", "U00100000");
		// expectString("'\\u{10FFFF}'", "U0010FFFF");
		// expectLexerError(
		// 	"'\\u{110000}'",
		// 	"<stdin>: error: Unicode escape sequence is out of range\n"
		// );
		// expectLexerError(
		// 	"'\\u{FFFFFFFF}'",
		// 	"<stdin>: error: Unicode escape sequence is out of range\n"
		// );

		// Line continuation
		// expectLexerError("'\n'", "<stdin>: error: Unterminated string literal\n");
		// expectLexerError("'\r'", "<stdin>: error: Unterminated string literal\n");
		// expectLexerError('"\n"', "<stdin>: error: Unterminated string literal\n");
		// expectLexerError('"\r"', "<stdin>: error: Unterminated string literal\n");

		// expectString("'\u2028'", "\u2028");
		// expectString("'\u2029'", "\u2029");
		// expectString('"\u2028"', "\u2028");
		// expectString('"\u2029"', "\u2029");

		// expectString("'1\\\r2'", "12");
		// expectString("'1\\\n2'", "12");
		// expectString("'1\\\r\n2'", "12");
		// expectString("'1\\\u20282'", "12");
		// expectString("'1\\\u20292'", "12");
		// expectLexerError(
		// 	"'1\\\n\r2'",
		// 	"<stdin>: error: Unterminated string literal\n"
		// );

		// expectLexerError("\"'", "<stdin>: error: Unexpected end of file\n");
		// expectLexerError("'\"", "<stdin>: error: Unexpected end of file\n");
		// expectLexerError("'\\", "<stdin>: error: Unexpected end of file\n");
		// expectLexerError("'\\'", "<stdin>: error: Unexpected end of file\n");

		// expectLexerError("'\\x", "<stdin>: error: Unexpected end of file\n");
		// expectLexerError("'\\x'", '<stdin>: error: Syntax error "\'"\n');
		// expectLexerError("'\\xG'", '<stdin>: error: Syntax error "G"\n');
		// expectLexerError("'\\xF'", '<stdin>: error: Syntax error "\'"\n');
		// expectLexerError("'\\xFG'", '<stdin>: error: Syntax error "G"\n');

		// expectLexerError("'\\u", "<stdin>: error: Unexpected end of file\n");
		// expectLexerError("'\\u'", '<stdin>: error: Syntax error "\'"\n');
		// expectLexerError("'\\u0'", '<stdin>: error: Syntax error "\'"\n');
		// expectLexerError("'\\u00'", '<stdin>: error: Syntax error "\'"\n');
		// expectLexerError("'\\u000'", '<stdin>: error: Syntax error "\'"\n');
	});

	it("should lex hashbang", () => {
		expectHashbang("#!/usr/bin/env node", "#!/usr/bin/env node");
		expectHashbang("#!/usr/bin/env node\n", "#!/usr/bin/env node");
		expectHashbang("#!/usr/bin/env node\nlet x", "#!/usr/bin/env node");
		expectLexerError(" #!/usr/bin/env node", SyntaxError);
	});
});
