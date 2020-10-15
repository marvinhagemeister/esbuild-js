import { newLexer } from "../lexer";
import { Token } from "../tokens";
import expect from "expect";

export function expectNumber(input: string, expected: number) {
	const lexer = newLexer(input);
	expect(lexer.token).toBe(Token.NumericLiteral);
	expect(lexer.number).toBe(expected);
}
