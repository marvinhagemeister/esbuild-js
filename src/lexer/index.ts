import { stat } from "fs";
import { char2Flag, CharFlags } from "../lexer-ascii";
import { Char } from "../lexer_helpers";
import { Token, TokenFlags } from "../tokens";
import { scanIdentifier, scanIdentifierOrKeyword } from "./identifier";
import { scanNumberLiteral } from "./numeric";
import { scanStringLiteral } from "./string";
import { firstChar } from "./utils";

export interface Lexer2 {
	i: number;
	char: number;
	source: string;
	token: TokenFlags;
	flags: CharFlags;
	value: string;
	number: number;
	string: string;
	start: number;
	end: number;
	line: number;
	column: number;
	hasNewLineBefore: boolean;
	commentBefore: string[] | null;
	rescanCloseBraceAsTemplateToken: boolean;
}

export function createLexer(source: string): Lexer2 {
	return {
		i: 0,
		char: source.charCodeAt(0),
		source,
		token: TokenFlags.Unknown,
		flags: CharFlags.Unknown,
		value: "",
		number: 0,
		string: "",
		start: 0,
		end: 0,
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
	lexer.char = i < source.length ? source.charCodeAt(i) : Char.EndOfFile;
	lexer.flags =
		lexer.char !== Char.EndOfFile ? char2Flag[lexer.char] : CharFlags.Unknown;

	return lexer.char;
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

export function expectToken2(lexer: Lexer2, token: TokenFlags) {
	if (lexer.token !== token) {
		throwSyntaxError(lexer, "Unexpected token");
	}

	scanSingleToken(lexer);
}

export function consumeOp(lexer: Lexer2, token: TokenFlags) {
	if (lexer.token === token) {
		scanSingleToken(lexer);
		return true;
	}

	return false;
}

function skipWhiteSpace(lexer: Lexer2) {
	while (lexer.i < lexer.source.length) {
		const ch = lexer.source.charCodeAt(lexer.i);
		switch (ch) {
			case Char.NewLine:
			case Char["\r"]:
				lexer.line++;
				lexer.column = 0;
				break;
			case Char.Tab:
			case Char.LineTab:
			case Char.FormFeed:
			case Char.EmSpace:
			case Char.NoBreakSpace:
			case Char.Space:
				step(lexer);
				break;
			default:
				lexer.start = lexer.i;
				return;
		}
	}
}

export function nextToken2(lexer: Lexer2) {
	lexer.start = lexer.i;
	lexer.end = lexer.i;
	lexer.token = scanSingleToken(lexer);
}

export function scanSingleToken(lexer: Lexer2) {
	skipWhiteSpace(lexer);

	let ch = lexer.source.charCodeAt(lexer.i);
	if (ch === Char.EndOfFile) return Token.EndOfFile;

	if (ch > Char.z) {
		// TODO: Unicode
		throw new Error("TODO: Unicode");
	}

	const token = firstChar[ch];
	switch (token) {
		// a..z
		case TokenFlags.IdentifierOrKeyword:
			return scanIdentifierOrKeyword(lexer, ch);
		// A...Z or _ or $
		case TokenFlags.Identifier:
			return scanIdentifier(lexer, ch);
		// 0..9
		case TokenFlags.NumericLiteral:
			return scanNumberLiteral(lexer, ch);
		// 'string' or "string"
		case TokenFlags.StringLiteral:
			return scanStringLiteral(lexer);
		// `=` or `==` or `===` or `=>`
		case TokenFlags.Equals:
			ch = lexer.source.charCodeAt(++lexer.i);
			if (ch === Char.Equal) {
				ch = lexer.source.charCodeAt(++lexer.i);
				if (ch === Char.Equal) {
					return TokenFlags["==="];
				}
				return TokenFlags["=="];
			}

			return TokenFlags.Equals;
		default:
			// throwSyntaxError(lexer, "nope " + ch + " " + String.fromCharCode(ch));
			lexer.i++;
			return TokenFlags.EndOfFile;
	}
}
