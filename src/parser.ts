import { Lexer, newLexer } from "./lexer";
import { Token } from "./tokens";

export interface Parser {}

export function newParser(lexer: Lexer): Parser {
	return {};
}

export interface ParserOptions {}
export function parse(source: string) {
	const lexer = newLexer(source);

	const parser = newParser(lexer);

	parseStatementsUpTo(parser, Token.EOF);
	const ast = null;

	return ast;
}

export function parseStatementsUpTo(p: Parser, token: Token) {}
