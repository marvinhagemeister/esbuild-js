import { char2Flag, CharFlags } from "../lexer-ascii";
import { Char } from "../lexer_helpers";
import { Token } from "../tokens";

export interface Lexer2 {
	i: number;
	char: number;
	source: string;
	token: Token;
	flags: CharFlags;
	identifier: string;
	number: number;
	string: string;
	start: number;
	line: number;
	column: number;
	hasNewLineBefore: boolean;
	commentBefore: string[] | null;
	rescanCloseBraceAsTemplateToken: boolean;
}

export function createLexer(source: string): Lexer2 {
	return {
		i: 0,
		char: -1,
		source,
		token: Token.Unknown,
		flags: CharFlags.Unknown,
		identifier: "",
		number: 0,
		string: "",
		start: 0,
		line: 0,
		column: 0,
		hasNewLineBefore: false,
		commentBefore: null,
		rescanCloseBraceAsTemplateToken: false,
	};
}

export function step(lexer: Lexer2) {
	const source = lexer.source;
	const i = ++lexer.i;
	lexer.column++;
	lexer.char = i < source.length ? source.charCodeAt(i)! : Char.EndOfFile;
	lexer.flags =
		lexer.char !== Char.EndOfFile ? char2Flag[lexer.char] : CharFlags.Unknown;
}

export function getRaw(lexer: Lexer2) {
	return lexer.source.slice(lexer.start, lexer.i);
}

export interface CustomSyntaxError extends SyntaxError {
	source: string;
	line: number;
	column: number;
}

export function throwSyntaxError(lexer: Lexer2, message: string) {
	const err = new SyntaxError(message) as CustomSyntaxError;
	err.source = lexer.source;
	err.line = lexer.line;
	err.column = lexer.column;
	throw err;
}
