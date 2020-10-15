import { Lexer, step } from "../lexer";
import { CharFlags } from "../lexer-ascii";
import { Char } from "../lexer_helpers";
import { Token } from "../tokens";

export function scanNumberLiteral(lexer: Lexer) {
	lexer.token = Token.NumericLiteral;

	const first = lexer.char;

	// Check for binary, octal, or hexadecimal literal
	let isLegacyOctalLiteral = false;
	let base = 0;
	if (first === Char.n0) {
		if ((lexer.flags & CharFlags.Base2) === CharFlags.Base2) {
			base = 2;
		} else if ((lexer.flags & CharFlags.Base8) === CharFlags.Base8) {
			base = 8;
			isLegacyOctalLiteral = lexer.char < Char.O;
		} else if ((lexer.flags & CharFlags.Base16) === CharFlags.Base16) {
			base = 16;
		}
	}

	if (base === 0) {
		// Floating Point Literal
		let lastUnderscore = -1;
		while ((lexer.flags & CharFlags.Number) === CharFlags.Number) {
			if (lexer.char === Char["_"]) {
				if (lastUnderscore === lexer.i - 1) {
					throw new SyntaxError(
						`Underscore can't occur multiple times in a row in numeric literals`
					);
				}
				lastUnderscore = lexer.i;
			}
			step(lexer);
		}
	} else {
		// Integer Literal
		if (!isLegacyOctalLiteral) {
			step(lexer);
		}

		while ((lexer.flags & CharFlags.Number) === CharFlags.Number) {
			step(lexer);
		}
	}

	if ((lexer.flags & CharFlags.IdStart) === CharFlags.IdStart) {
		throw new SyntaxError(`Identifiers can't occur immediately after a number`);
	}
}