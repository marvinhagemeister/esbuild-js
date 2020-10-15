import { CharFlags } from "../lexer-ascii";
import { Char } from "../lexer_helpers";
import { Token } from "../tokens";
import { Lexer2, step } from "./core";

function assertUnderscore(lexer: Lexer2, last: number) {
	if (lexer.char === Char["_"]) {
		if (last === lexer.i - 1) {
			throw new SyntaxError(
				"Underscore can't occur multiple times in a row in numeric literals"
			);
		}

		last = lexer.i;
	}

	return last;
}

export function scanNumberLiteral(lexer: Lexer2, ch: number) {
	lexer.token = Token.NumericLiteral;

	const first = ch;

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

	let lastUnderscore = -1;
	if (base === 0) {
		// Floating Point Literal
		while ((lexer.flags & CharFlags.Number) === CharFlags.Number) {
			lastUnderscore = assertUnderscore(lexer, lastUnderscore);
			step(lexer);
		}
	} else {
		// Integer Literal
		if (!isLegacyOctalLiteral) {
			step(lexer);
		}

		while ((lexer.flags & CharFlags.Number) === CharFlags.Number) {
			lastUnderscore = assertUnderscore(lexer, lastUnderscore);
			step(lexer);
		}
	}

	if (lastUnderscore + 1 === lexer.i) {
		throw new SyntaxError(`Numeric literal must not end with an underscore`);
	} else if ((lexer.flags & CharFlags.IdStart) === CharFlags.IdStart) {
		throw new SyntaxError(`Identifiers can't occur immediately after a number`);
	}
}
