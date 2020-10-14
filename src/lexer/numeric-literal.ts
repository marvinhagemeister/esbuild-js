import { getRaw, Lexer, step, throwSyntaxError } from "../lexer";
import { Char, isIdentifierStart } from "../lexer_helpers";
import { Token } from "../tokens";
import { char2Flag, CharFlags } from "./tables";

function filterOutUnderscores(lexer: Lexer, underscoreCount: number) {
	let text = getRaw(lexer);
	if (underscoreCount > 0) {
		// TODO: Is it okay to build up the string via concatenation?
		let out = "";
		for (let i = 0; i < text.length; i++) {
			if (text[i] !== "_") {
				out += text[i];
			}
		}
		return out;
	}
	return text;
}

export function parseNumericLiteralOrDot(lexer: Lexer, ch: number): Token {
	if (ch < 127) {
		while (char2Flag[ch] & CharFlags.Number) {
			ch = step(lexer);
		}
	}

	lexer.token = Token.NumericLiteral;
	lexer.number = Number(getRaw(lexer));

	return Token.NumericLiteral;

	// // Number or dot
	// const first = lexer.codePoint;
	// step(lexer);

	// // Dot without a digit after it
	// if (
	// 	first === Char.Dot &&
	// 	(lexer.codePoint < Char.n0 || lexer.codePoint > Char.n9)
	// ) {
	// 	// "..."
	// 	if (
	// 		lexer.codePoint === Char.Dot &&
	// 		lexer.i < lexer.source.length &&
	// 		lexer.source[lexer.i] == "."
	// 	) {
	// 		step(lexer);
	// 		step(lexer);
	// 		lexer.token = Token.DotDotDot;
	// 		// return;
	// 	}

	// 	// "."
	// 	lexer.token = Token.Dot;
	// 	// return;
	// }

	// let underscoreCount = 0;
	// let lastUnderscoreEnd = 0;
	// let hasDotOrExponent = first === Char.Dot;
	// let isLegacyOctalLiteral = false;
	// let base = 0;

	// // Assume this is a number, but potentially change to a bigint later
	// lexer.token = Token.NumericLiteral;

	// // Check for binary, octal, or hexadecimal literal
	// if (first === Char.n0) {
	// 	switch (lexer.codePoint) {
	// 		case Char.b:
	// 		case Char.B:
	// 			base = 2;
	// 			break;

	// 		case Char.o:
	// 		case Char.O:
	// 			base = 8;
	// 			break;

	// 		case Char.x:
	// 		case Char.X:
	// 			base = 16;
	// 			break;

	// 		case Char.n0:
	// 		case Char.n1:
	// 		case Char.n2:
	// 		case Char.n3:
	// 		case Char.n4:
	// 		case Char.n5:
	// 		case Char.n6:
	// 		case Char.n7:
	// 			base = 8;
	// 			isLegacyOctalLiteral = true;
	// 	}
	// }

	// if (base !== 0) {
	// 	// Integer literal
	// 	let isFirst = true;
	// 	let isInvalidLegacyOctalLiteral = false;
	// 	lexer.number = 0;
	// 	if (!isLegacyOctalLiteral) {
	// 		step(lexer);
	// 	}

	// 	integerLiteral: while (true) {
	// 		switch (lexer.codePoint) {
	// 			case Char._:
	// 				// Cannot have multiple underscores in a row
	// 				if (lastUnderscoreEnd > 0 && lexer.end === lastUnderscoreEnd + 1) {
	// 					throwSyntaxError(lexer);
	// 				}

	// 				// The first digit must exist
	// 				if (isFirst) {
	// 					throwSyntaxError(lexer);
	// 				}

	// 				lastUnderscoreEnd = lexer.end;
	// 				underscoreCount++;
	// 				break;
	// 			case Char.n0:
	// 			case Char.n1:
	// 				lexer.number = lexer.number * base + (lexer.codePoint - Char.n0);
	// 				break;
	// 			case Char.n2:
	// 			case Char.n3:
	// 			case Char.n4:
	// 			case Char.n5:
	// 			case Char.n6:
	// 			case Char.n7:
	// 				if (base == 2) {
	// 					throwSyntaxError(lexer);
	// 				}
	// 				lexer.number = lexer.number * base + (lexer.codePoint - Char.n0);
	// 				break;
	// 			case Char.n8:
	// 			case Char.n9:
	// 				if (isLegacyOctalLiteral) {
	// 					isInvalidLegacyOctalLiteral = true;
	// 				} else if (base < 10) {
	// 					throwSyntaxError(lexer);
	// 				}
	// 				lexer.number = lexer.number * base + (lexer.codePoint - Char.n0);

	// 				break;
	// 			case Char.A:
	// 			case Char.B:
	// 			case Char.C:
	// 			case Char.D:
	// 			case Char.E:
	// 			case Char.F:
	// 				if (base !== 16) {
	// 					throwSyntaxError(lexer);
	// 				}
	// 				lexer.number = lexer.number * base + (lexer.codePoint + 10 - Char.A);
	// 				break;
	// 			case Char.a:
	// 			case Char.b:
	// 			case Char.c:
	// 			case Char.d:
	// 			case Char.e:
	// 			case Char.f:
	// 				if (base !== 16) {
	// 					throwSyntaxError(lexer);
	// 				}
	// 				lexer.number = lexer.number * base + (lexer.codePoint + 10 - Char.a);
	// 				break;
	// 			default:
	// 				// The first digit must exist
	// 				if (isFirst) {
	// 					throwSyntaxError(lexer);
	// 				}

	// 				break integerLiteral;
	// 		}

	// 		step(lexer);
	// 		isFirst = false;
	// 	}

	// 	let isBigIntegerLiteral = lexer.codePoint === Char.n && !hasDotOrExponent;

	// 	// Slow path: do we need to re-scan the input as text?
	// 	if (isBigIntegerLiteral || isInvalidLegacyOctalLiteral) {
	// 		// Can't use a leading zero for bigint literals
	// 		if (isBigIntegerLiteral && isLegacyOctalLiteral) {
	// 			throwSyntaxError(lexer);
	// 		}

	// 		const text = filterOutUnderscores(lexer, underscoreCount);

	// 		// Store bigints as text to avoid precision loss
	// 		if (isBigIntegerLiteral) {
	// 			lexer.identifier = text;
	// 		} else if (isInvalidLegacyOctalLiteral) {
	// 			// Legacy octal literals may turn out to be a base 10 literal after all
	// 			let value = Number(text);
	// 			lexer.number = value;
	// 		}
	// 	}
	// } else {
	// 	// Floating-point literal

	// 	// Initial digits
	// 	while (true) {
	// 		if (lexer.codePoint < Char.n0 || lexer.codePoint > Char.n9) {
	// 			if (lexer.codePoint !== Char._) {
	// 				break;
	// 			}

	// 			// Cannot have multiple underscores in a row
	// 			if (lastUnderscoreEnd > 0 && lexer.end == lastUnderscoreEnd + 1) {
	// 				throwSyntaxError(lexer);
	// 			}

	// 			lastUnderscoreEnd = lexer.end;
	// 			underscoreCount++;
	// 		}
	// 		step(lexer);
	// 	}

	// 	// Fractional digits
	// 	if (first !== Char.Dot && lexer.codePoint === Char.Dot) {
	// 		// An underscore must not come last
	// 		if (lastUnderscoreEnd > 0 && lexer.end == lastUnderscoreEnd + 1) {
	// 			lexer.end--;
	// 			throwSyntaxError(lexer);
	// 		}

	// 		hasDotOrExponent = true;
	// 		step(lexer);
	// 		while (true) {
	// 			if (lexer.codePoint < Char.n0 || lexer.codePoint > Char.n9) {
	// 				if ((lexer.codePoint as number) !== Char._) {
	// 					break;
	// 				}

	// 				// Cannot have multiple underscores in a row
	// 				if (lastUnderscoreEnd > 0 && lexer.end == lastUnderscoreEnd + 1) {
	// 					throwSyntaxError(lexer);
	// 				}

	// 				lastUnderscoreEnd = lexer.end;
	// 				underscoreCount++;
	// 			}
	// 			step(lexer);
	// 		}
	// 	}

	// 	// Exponent
	// 	if (lexer.codePoint === Char.e || lexer.codePoint == Char.E) {
	// 		// An underscore must not come last
	// 		if (lastUnderscoreEnd > 0 && lexer.end == lastUnderscoreEnd + 1) {
	// 			lexer.end--;
	// 			throwSyntaxError(lexer);
	// 		}

	// 		hasDotOrExponent = true;
	// 		step(lexer);
	// 		if (
	// 			(lexer.codePoint as number) === Char.Plus ||
	// 			(lexer.codePoint as number) === Char.Minus
	// 		) {
	// 			step(lexer);
	// 		}
	// 		if (lexer.codePoint < Char.n0 || lexer.codePoint > Char.n9) {
	// 			throwSyntaxError(lexer);
	// 		}
	// 		while (true) {
	// 			if (lexer.codePoint < Char.n0 || lexer.codePoint > Char.n9) {
	// 				if ((lexer.codePoint as number) !== Char._) {
	// 					break;
	// 				}

	// 				// Cannot have multiple underscores in a row
	// 				if (lastUnderscoreEnd > 0 && lexer.end == lastUnderscoreEnd + 1) {
	// 					throwSyntaxError(lexer);
	// 				}

	// 				lastUnderscoreEnd = lexer.end;
	// 				underscoreCount++;
	// 			}
	// 			step(lexer);
	// 		}
	// 	}

	// 	// Take a slice of the text to parse
	// 	let text = filterOutUnderscores(lexer, underscoreCount);

	// 	if (lexer.codePoint === Char.n && !hasDotOrExponent) {
	// 		// The only bigint literal that can start with 0 is "0n"
	// 		if (text.length > 1 && first === Char.n0) {
	// 			throwSyntaxError(lexer);
	// 		}

	// 		// Store bigints as text to avoid precision loss
	// 		lexer.number = Number(text);
	// 	} else if (!hasDotOrExponent && lexer.end - lexer.start < 10) {
	// 		// Parse a 32-bit integer
	// 		lexer.number = +text;
	// 	} else {
	// 		// Parse a double-precision floating-point number
	// 		lexer.number = parseFloat(text);
	// 	}
	// }

	// // An underscore must not come last
	// if (lastUnderscoreEnd > 0 && lexer.end == lastUnderscoreEnd + 1) {
	// 	lexer.end--;
	// 	throwSyntaxError(lexer);
	// }

	// // Handle bigint literals after the underscore-at-end check above
	// if (lexer.codePoint === Char.n && !hasDotOrExponent) {
	// 	lexer.token = Token.BigIntLiteral;
	// 	step(lexer);
	// }

	// // Identifiers can't occur immediately after numbers
	// if (isIdentifierStart(lexer.codePoint)) {
	// 	throwSyntaxError(lexer);
	// }
}
