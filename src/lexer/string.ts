import { CharFlags } from "../lexer-ascii";
import { Char } from "../lexer_helpers";
import { TokenFlags } from "../tokens";
import { Lexer2, step, throwSyntaxError } from "./index";

export function scanStringLiteral(lexer: Lexer2) {
	const quote = lexer.char;
	// TODO: Template literals
	lexer.token =
		quote === Char.Backtick
			? TokenFlags.TemplateHead
			: TokenFlags.StringLiteral;
	step(lexer);

	let suffixLen = 0;
	// TODO: Add support for escaped codes
	// TODO: Unicode
	while (lexer.char !== quote && lexer.char !== Char.EndOfFile) {
		if (
			quote !== Char.Backtick &&
			(lexer.flags & CharFlags.NewLine) === CharFlags.NewLine
		) {
			throwSyntaxError(
				lexer,
				`Unterminated string literal. Newline characters need to be escaped.`
			);
		}

		if (lexer.char === Char.$) {
			if (quote === Char.Backtick) {
				step(lexer);

				if ((lexer.char as number) === Char["{"]) {
					lexer.token = TokenFlags.TemplateHead;
					suffixLen = 2;
					step(lexer);
					break;
				}
			}
		}

		step(lexer);
	}

	if (quote !== Char.Backtick && lexer.char !== quote) {
		throwSyntaxError(lexer, "Unterminated string literal");
	}

	lexer.string = lexer.source.slice(lexer.start + 1, lexer.i - suffixLen);
}
