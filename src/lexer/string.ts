import { expectToken, Lexer, step } from "../lexer";
import { CharFlags } from "../lexer-ascii";
import { Char } from "../lexer_helpers";
import { Token } from "../tokens";

export function scanStringLiteral(lexer: Lexer) {
	const quote = lexer.char;
	// TODO: Template literals
	lexer.token = Token.StringLiteral;
	step(lexer);

	// TODO: Add support for escaped codes
	// TODO: Unicode
	while (lexer.char !== quote && lexer.char !== Char.EndOfFile) {
		if ((lexer.flags & CharFlags.NewLine) === CharFlags.NewLine) {
			throw new SyntaxError(
				`Unterminated string literal. Newline characters need to be escaped.`
			);
		}

		step(lexer);
	}

	if (lexer.char !== quote) {
		throw new SyntaxError("Unterminated string literal");
	}

	lexer.string = lexer.source.slice(lexer.start + 1, lexer.end);
}
