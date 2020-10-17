import { char2Flag, CharFlags } from "../lexer-ascii";
import { Char } from "../lexer_helpers";
import { Token } from "../tokens";
import { Lexer2, step, throwSyntaxError } from "./index";

export function scanStringLiteral(lexer: Lexer2) {
	const quote = lexer.source.charCodeAt(lexer.i);
	// TODO: Template literals
	const token =
		quote === Char.Backtick ? Token.TemplateHead : Token.StringLiteral;

	let ch = lexer.source.charCodeAt(++lexer.i);

	let suffixLen = 0;
	// TODO: Add support for escaped codes
	// TODO: Unicode
	while (ch !== quote && ch !== Char.EndOfFile) {
		if (quote !== Char.Backtick) {
			const flags = char2Flag[ch];
			if ((flags & CharFlags.NewLine) === CharFlags.NewLine) {
				throwSyntaxError(
					lexer,
					`Unterminated string literal. Newline characters need to be escaped.`
				);
			}
		}

		if (ch === Char.$) {
			// if (quote === Char.Backtick) {
			// 	ch = lexer.source.charCodeAt(++lexer.i);
			// 	if (ch === Char["{"]) {
			// 		lexer.token = Token.TemplateHead;
			// 		suffixLen = 2;
			// 		ch = lexer.source.charCodeAt(++lexer.i);
			// 		break;
			// 	}
			// }
		}

		if (lexer.i >= lexer.source.length) break;
		ch = lexer.source.charCodeAt(++lexer.i);
	}

	if (quote !== Char.Backtick && ch !== quote) {
		throwSyntaxError(lexer, "Unterminated string literal");
	}

	lexer.string = lexer.source.slice(lexer.start + 1, lexer.i - suffixLen);
	lexer.i++;
	return token;
}
