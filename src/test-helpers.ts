import expect from "expect";
import { newLexer } from "./lexer";
import { parse } from "./parser";
import { serialize } from "./serialize";
import { Token } from "./tokens";

export function expectPrinted(source: string, expected: string) {
	const ast = parse(source);
	const out = serialize(ast, { newLineChar: "\n", indentChar: "  " });
	expect(out).toBe(expected);
}

export function expectNumber(input: string, expected: number) {
	const lexer = newLexer(input);
	expect(lexer.number).toBe(expected);
	expect(lexer.token).toBe(Token.NumericLiteral);
}
