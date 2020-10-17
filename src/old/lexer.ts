import { Token, keywords } from "../tokens";
import * as logger from "../logger";
import {
	isIdentifierStart,
	isIdentifierContinue,
	isWhitespace,
	Char,
	IdenitfierKind,
	isIdentifier,
	isKeyword,
	formatLexerPosition,
} from "../lexer_helpers";
import { char2Flag, CharFlags } from "../lexer-ascii";

export interface Lexer {
	i: number;
	char: number;
	source: string;
	hasNewLineBefore: boolean;
	token: Token;
	flags: CharFlags;
	identifier: string;
	number: number;
	string: string;
	start: number;
	end: number;
	isLogDisabled: boolean;
	commentBefore: string[] | null;
	rescanCloseBraceAsTemplateToken: boolean;
	logger: logger.Logger;
}

export function createLexer(source: string): Lexer {
	return {
		i: -1,
		char: -1,
		source,
		hasNewLineBefore: false,
		rescanCloseBraceAsTemplateToken: false,
		token: 0,
		number: 0,
		string: "",
		identifier: "",
		commentBefore: null,
		start: 0,
		end: 0,
		flags: CharFlags.Unknown,
		isLogDisabled: false,
		logger: {
			logs: [],
		},
	};
}

export function newLexer(source: string): Lexer {
	const lexer = createLexer(source);
	step(lexer);
	nextToken(lexer);

	return lexer;
}

export function step(lexer: Lexer) {
	const source = lexer.source;
	const i = ++lexer.i;
	lexer.char = i < source.length ? source.charCodeAt(i)! : Char.EndOfFile;
	lexer.end = i;
	lexer.flags =
		lexer.char !== Char.EndOfFile ? char2Flag[lexer.char] : CharFlags.Unknown;
}

function addError(lexer: Lexer, loc: number, text: string) {
	if (!lexer.isLogDisabled) {
		logger.addError(lexer.logger, lexer.source, loc, text);
	}
}

export function getRaw(lexer: Lexer) {
	return lexer.source.slice(lexer.start, lexer.end);
}

function throwSyntaxError(lexer: Lexer) {
	const loc = lexer.end;
	let message = "Unexpected end of file";
	if (lexer.end < lexer.source.length) {
		// let c = utf8.DecodeRuneInString(lexer.source.slice[lexer.end:])
		let c = lexer.source.charCodeAt(lexer.end)!;
		if (c < 0x20) {
			message = `Syntax error \"\\x${c}02X\"`;
		} else if (c >= 0x80) {
			message = `Syntax error \"\\u{${c}x}\"`;
		} else if (c !== Char.DoubleQuote) {
			message = `Syntax error \"${c}c\"`;
		} else {
			message = "Syntax error '\"'";
		}
	}
	addError(lexer, loc, message);
	throw new SyntaxError(message);
}

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

export function expectToken(lexer: Lexer, token: Token) {
	if (lexer.token !== token) {
		console.log(formatLexerPosition(lexer));
		throw new Error(`Expected token ${token}, but got ${lexer.token}`);
	}

	nextToken(lexer);
}

export function expectOrInsertSemicolon(lexer: Lexer) {
	if (
		lexer.token === Token.SemiColon ||
		(!lexer.hasNewLineBefore &&
			lexer.token !== Token.CloseParen &&
			lexer.token !== Token.EndOfFile)
	) {
		expectToken(lexer, Token.SemiColon);
	}
}

export function isContextualKeyword(lexer: Lexer, text: string) {
	return lexer.token === Token.Identifier && getRaw(lexer) === text;
}

function parseNumericLiteralOrDot(lexer: Lexer) {
	// Number or dot
	const first = lexer.char;
	step(lexer);

	let flags = lexer.flags;
	// Dot without a digit after it
	if (first === Char.Dot && (flags & CharFlags.Number) === 0) {
		// "..."
		if (
			lexer.char === Char.Dot &&
			lexer.i < lexer.source.length &&
			lexer.source[lexer.i] == "."
		) {
			step(lexer);
			step(lexer);
			lexer.token = Token["..."];
			return;
		}

		// "."
		lexer.token = Token["."];
		return;
	}

	let underscoreCount = 0;
	let lastUnderscoreEnd = 0;
	let hasDotOrExponent = first === Char.Dot;
	let isLegacyOctalLiteral = false;
	let base = 0;

	// Assume this is a number, but potentially change to a bigint later
	lexer.token = Token.NumericLiteral;

	if (lexer.char === Char.EndOfFile) {
		return;
	}

	let legacyOctalLiteral = false;
	flags = lexer.flags;
	// Check for binary, octal, or hexadecimal literal
	if (first === Char.n0) {
		switch (lexer.char) {
			case Char.b:
			case Char.B:
				base = 2;
				break;

			case Char.o:
			case Char.O:
				base = 8;
				break;

			case Char.x:
			case Char.X:
				base = 16;
		}
	}

	if (base !== 0) {
		// Integer literal
		let isFirst = true;
		let isInvalidLegacyOctalLiteral = false;
		lexer.number = 0;
		if (!isLegacyOctalLiteral) {
			step(lexer);
		}

		integerLiteral: while (true) {
			switch (lexer.char) {
				case Char._:
					// Cannot have multiple underscores in a row
					if (lastUnderscoreEnd > 0 && lexer.end === lastUnderscoreEnd + 1) {
						throwSyntaxError(lexer);
					}

					// The first digit must exist
					if (isFirst) {
						throwSyntaxError(lexer);
					}

					lastUnderscoreEnd = lexer.end;
					underscoreCount++;
					break;
				case Char.n0:
				case Char.n1:
					lexer.number = lexer.number * base + (lexer.char - Char.n0);
					break;
				case Char.n2:
				case Char.n3:
				case Char.n4:
				case Char.n5:
				case Char.n6:
				case Char.n7:
					if (base == 2) {
						throwSyntaxError(lexer);
					}
					lexer.number = lexer.number * base + (lexer.char - Char.n0);
					break;
				case Char.n8:
				case Char.n9:
					if (isLegacyOctalLiteral) {
						isInvalidLegacyOctalLiteral = true;
					} else if (base < 10) {
						throwSyntaxError(lexer);
					}
					lexer.number = lexer.number * base + (lexer.char - Char.n0);

					break;
				case Char.A:
				case Char.B:
				case Char.C:
				case Char.D:
				case Char.E:
				case Char.F:
					if (base !== 16) {
						throwSyntaxError(lexer);
					}
					lexer.number = lexer.number * base + (lexer.char + 10 - Char.A);
					break;
				case Char.a:
				case Char.b:
				case Char.c:
				case Char.d:
				case Char.e:
				case Char.f:
					if (base !== 16) {
						throwSyntaxError(lexer);
					}
					lexer.number = lexer.number * base + (lexer.char + 10 - Char.a);
					break;
				default:
					// The first digit must exist
					if (isFirst) {
						throwSyntaxError(lexer);
					}

					break integerLiteral;
			}

			step(lexer);
			isFirst = false;
		}

		let isBigIntegerLiteral = lexer.char === Char.n && !hasDotOrExponent;

		// Slow path: do we need to re-scan the input as text?
		if (isBigIntegerLiteral || isInvalidLegacyOctalLiteral) {
			// Can't use a leading zero for bigint literals
			if (isBigIntegerLiteral && isLegacyOctalLiteral) {
				throwSyntaxError(lexer);
			}

			const text = filterOutUnderscores(lexer, underscoreCount);

			// Store bigints as text to avoid precision loss
			if (isBigIntegerLiteral) {
				lexer.identifier = text;
			} else if (isInvalidLegacyOctalLiteral) {
				// Legacy octal literals may turn out to be a base 10 literal after all
				let value = Number(text);
				lexer.number = value;
			}
		}
	} else {
		// Floating-point literal

		// Initial digits
		while (true) {
			const flags = char2Flag[lexer.char];
			if ((flags & CharFlags.Number) === CharFlags.Number) {
				if (lexer.char !== Char._) {
					break;
				}

				// Cannot have multiple underscores in a row
				if (lastUnderscoreEnd > 0 && lexer.end == lastUnderscoreEnd + 1) {
					throwSyntaxError(lexer);
				}

				lastUnderscoreEnd = lexer.end;
				underscoreCount++;
			}
			step(lexer);
		}

		// Fractional digits
		if (first !== Char.Dot && lexer.char === Char.Dot) {
			// An underscore must not come last
			if (lastUnderscoreEnd > 0 && lexer.end == lastUnderscoreEnd + 1) {
				lexer.end--;
				throwSyntaxError(lexer);
			}

			hasDotOrExponent = true;
			step(lexer);
			while (true) {
				if (lexer.char < Char.n0 || lexer.char > Char.n9) {
					if ((lexer.char as number) !== Char._) {
						break;
					}

					// Cannot have multiple underscores in a row
					if (lastUnderscoreEnd > 0 && lexer.end == lastUnderscoreEnd + 1) {
						throwSyntaxError(lexer);
					}

					lastUnderscoreEnd = lexer.end;
					underscoreCount++;
				}
				step(lexer);
			}
		}

		// Exponent
		if (lexer.char === Char.e || lexer.char == Char.E) {
			// An underscore must not come last
			if (lastUnderscoreEnd > 0 && lexer.end == lastUnderscoreEnd + 1) {
				lexer.end--;
				throwSyntaxError(lexer);
			}

			hasDotOrExponent = true;
			step(lexer);
			if (
				(lexer.char as number) === Char.Plus ||
				(lexer.char as number) === Char.Minus
			) {
				step(lexer);
			}
			if (lexer.char < Char.n0 || lexer.char > Char.n9) {
				throwSyntaxError(lexer);
			}
			while (true) {
				if (lexer.char < Char.n0 || lexer.char > Char.n9) {
					if ((lexer.char as number) !== Char._) {
						break;
					}

					// Cannot have multiple underscores in a row
					if (lastUnderscoreEnd > 0 && lexer.end == lastUnderscoreEnd + 1) {
						throwSyntaxError(lexer);
					}

					lastUnderscoreEnd = lexer.end;
					underscoreCount++;
				}
				step(lexer);
			}
		}

		// Take a slice of the text to parse
		let text = filterOutUnderscores(lexer, underscoreCount);

		if (lexer.char === Char.n && !hasDotOrExponent) {
			// The only bigint literal that can start with 0 is "0n"
			if (text.length > 1 && first === Char.n0) {
				throwSyntaxError(lexer);
			}

			// Store bigints as text to avoid precision loss
			lexer.number = Number(text);
		} else if (!hasDotOrExponent && lexer.end - lexer.start < 10) {
			// Parse a 32-bit integer
			lexer.number = +text;
		} else {
			// Parse a double-precision floating-point number
			lexer.number = parseFloat(text);
		}
	}

	// An underscore must not come last
	if (lastUnderscoreEnd > 0 && lexer.end == lastUnderscoreEnd + 1) {
		lexer.end--;
		throwSyntaxError(lexer);
	}

	// Handle bigint literals after the underscore-at-end check above
	if (lexer.char === Char.n && !hasDotOrExponent) {
		lexer.token = Token.BigIntLiteral;
		step(lexer);
	}

	// Identifiers can't occur immediately after numbers
	if (isIdentifierStart(lexer.char)) {
		throwSyntaxError(lexer);
	}
}

function scanIdentifierWithEscapes(lexer: Lexer, kind: IdenitfierKind) {
	// First pass: scan over the identifier to see how long it is
	while (true) {
		// FIXME: Double backslash?
		if (lexer.char === Char.BackSlash) {
			step(lexer);
			// @ts-ignore
			if (lexer.char !== Char.u) {
				throwSyntaxError(lexer);
			}

			step(lexer);
			// @ts-ignore
			if (lexer.char === Char["{"]) {
				step(lexer);
				// @ts-ignore
				while (lexer.char !== Char["}"]) {
					if (
						lexer.char < 127 &&
						(char2Flag[lexer.char] & CharFlags.Hex) === CharFlags.Hex
					) {
						step(lexer);
					} else {
						throwSyntaxError(lexer);
					}
				}

				step(lexer);
			} else {
				for (let i = 0; i < 4; i++) {
					if (
						lexer.char < 127 &&
						(char2Flag[lexer.char] & CharFlags.Hex) === CharFlags.Hex
					) {
						step(lexer);
					} else {
						throwSyntaxError(lexer);
					}
				}
			}

			continue;
		}

		if (!isIdentifierContinue(lexer.char)) {
			break;
		}

		step(lexer);
	}

	// Second pass: re-use our existing escape sequence parser
	// TODO: UTF-16
	let text = decodeEscapeSequences(lexer, lexer.start, getRaw(lexer));

	// Even though it was escaped, it must still be a valid identifier
	const identifier =
		kind === IdenitfierKind.PrivateIdentifier ? text.slice(1) : text;

	if (!isIdentifier(identifier)) {
		// FIXME: Print ranges
		// TODO: Should this be a warning?
		throw new SyntaxError(`Invalid identifier: ${text}`);
	}

	lexer.identifier = identifier;
	// Escaped keywords are not allowed to work as actual keywords, but they are
	// allowed wherever we allow identifiers or keywords. For example:
	//
	//   // This is an error (equivalent to "var var;")
	//   var \u0076\u0061\u0072;
	//
	//   // This is an error (equivalent to "var foo;" except for this rule)
	//   \u0076\u0061\u0072 foo;
	//
	//   // This is an fine (equivalent to "foo.var;")
	//   foo.\u0076\u0061\u0072;
	//
	return isKeyword(text) ? Token.EscapedKeyword : Token.Identifier;
}

export function decodeEscapeSequences(
	lexer: Lexer,
	start: number,
	text: string
): string {
	let decoded = "";

	for (let i = 0; i < text.length; i++) {
		let c = text.charCodeAt(i)!;

		if (c === Char.BackSlash && i + 1 < text.length) {
			let c2 = text.charCodeAt(i + 1)!;
			i += 1;

			switch (c2) {
				case Char.b:
					decoded += "\b";
					continue;
				case Char.f:
					decoded += "\f";
					continue;
				case Char.n:
					decoded += "\n";
					continue;
				case Char.r:
					decoded += "\r";
					continue;
				case Char.t:
					decoded += "\t";
					continue;

				case Char.v:
					// if lexer.json.parse {
					// 	lexer.end = start + i - width2
					// 	lexer.SyntaxError()
					// }

					decoded += "\v";
					continue;

				case Char.n0:
				case Char.n1:
				case Char.n2:
				case Char.n3:
				case Char.n4:
				case Char.n5:
				case Char.n6:
				case Char.n7:
					// if lexer.json.parse {
					// 	lexer.end = start + i - width2
					// 	lexer.SyntaxError()
					// }

					// 1-3 digit octal
					let value = c2 - Char.n0;
					let c3 = text.charCodeAt(i + 1)!;
					switch (c3) {
						case Char.n0:
						case Char.n1:
						case Char.n2:
						case Char.n3:
						case Char.n4:
						case Char.n5:
						case Char.n6:
						case Char.n7:
							value = value * 8 + c3 - Char.n0;
							i += 1;
							let c4 = text.charCodeAt(i + 1)!;
							switch (c4) {
								case Char.n0:
								case Char.n1:
								case Char.n2:
								case Char.n3:
								case Char.n4:
								case Char.n5:
								case Char.n6:
								case Char.n7:
									let temp = value * 8 + c4 - Char.n0;
									if (temp < 256) {
										value = temp;
										i += 1;
									}
							}
					}
					c = value;
					break;
				case Char.x:
					// if lexer.json.parse {
					// 	lexer.end = start + i - width2
					// 	lexer.SyntaxError()
					// }

					// 2-digit hexadecimal
					value = 0;
					for (let j = 0; j < 2; j++) {
						let c3 = text.charCodeAt(i)!;
						i += 1;
						switch (c3) {
							case Char.n0:
							case Char.n1:
							case Char.n2:
							case Char.n3:
							case Char.n4:
							case Char.n5:
							case Char.n6:
							case Char.n7:
							case Char.n8:
							case Char.n9:
								value = (value * 16) | (c3 - Char.n0);
								break;
							case Char.a:
							case Char.b:
							case Char.c:
							case Char.d:
							case Char.e:
							case Char.f:
								value = (value * 16) | (c3 + 10 - Char.a);
								break;
							case Char.A:
							case Char.B:
							case Char.C:
							case Char.D:
							case Char.E:
							case Char.F:
								value = (value * 16) | (c3 + 10 - Char.A);
								break;
							default:
								lexer.end = start + i - 1;
								throwSyntaxError(lexer);
						}
					}
					c = value;
					break;
				case Char.u: {
					// Unicode
					let value = 0;

					// Check the first character
					i += 1;
					let c3 = text.charCodeAt(i)!;

					// Afaik string.slice() does an allocation. We could probably
					// improve perf by rewriting this section and do the
					// conversion by hand like esbuild does, but this is easier
					// to maintain.
					if (c3 === Char["{"]) {
						i += 1;
						const start = i;
						while (text.charCodeAt(i) !== Char["}"]) {
							i++;
						}

						if (start === i) {
							throwSyntaxError(lexer);
						}

						value = parseInt(text.slice(start, i), 16);
					} else {
						// Fixed-length
						value = parseInt(text.slice(i, i + 4), 16);
						i += 3;
					}

					c = value;
					break;
				}
				case Char["\r"]:
					// Ignore line continuations. A line continuation is not an escaped newline.
					if (i < text.length && text[i] == "\n") {
						// Make sure Windows CRLF counts as a single newline
						i++;
					}
					continue;

				case Char.NewLine:
				case Char["\u2028"]:
				case Char["\u2029"]:
					// if lexer.json.parse {
					// 	lexer.end = start + i - width2
					// 	lexer.SyntaxError()
					// }

					// Ignore line continuations. A line continuation is not an escaped newline.
					continue;

				default:
					// if lexer.json.parse {
					// 	switch c2 {
					// 	case '"', '\\', '/':

					// 	default:
					// 		lexer.end = start + i - width2
					// 		lexer.SyntaxError()
					// 	}
					// }

					c = c2;
			}
		}

		if (c <= 0xffff) {
			decoded += String.fromCodePoint(c);
		} else {
			c -= 0x10000;
			// TODO: Probably not good for perf
			// decoded += append(decoded, uint16(0xD800+((c>>10)&0x3FF)), uint16(0xDC00+(c&0x3FF)))
		}
	}

	return decoded;
}

export function isIdentifierOrKeyword(lexer: Lexer) {
	return lexer.token >= Token.Identifier;
}

// TODO: Validate regex syntax
export function scanRegExp(lexer: Lexer) {
	while (true) {
		if (lexer.char === Char.Slash) {
			step(lexer);

			while (isIdentifierContinue(lexer.char)) {
				if ((char2Flag[lexer.char] & CharFlags.RegExp) === CharFlags.RegExp) {
					step(lexer);
				} else {
					throw new SyntaxError("Unexpected token in RegExp");
				}
			}
			return;
		}

		step(lexer);
	}
}

function scanCommentText(lexer: Lexer) {
	const text = lexer.source.slice(lexer.start, lexer.end);
	if (!lexer.commentBefore) {
		lexer.commentBefore = [];
	}
	lexer.commentBefore.push(text);
}

function scanIdentifier(lexer: Lexer) {
	step(lexer);

	while (isIdentifierContinue(lexer.char)) {
		step(lexer);
	}

	// TODO: Escape chars
	// TODO: Double backslash?
	// @ts-ignore
	if (lexer.char === Char.BackSlash) {
		lexer.token = scanIdentifierWithEscapes(
			lexer,
			IdenitfierKind.NormalIdentifier
		);
	} else {
		const content = getRaw(lexer);
		lexer.identifier = content;

		lexer.token =
			content !== "constructor" && content in keywords
				? (keywords as any)[content]
				: Token.Identifier;
	}
}

export function nextToken(lexer: Lexer) {
	lexer.hasNewLineBefore = lexer.end === 0;

	// Skip whitespace
	let flags = char2Flag[lexer.char];
	while ((flags & CharFlags.WhiteSpace) === CharFlags.WhiteSpace) {
		if ((flags & CharFlags.NewLine) === CharFlags.NewLine) {
			lexer.hasNewLineBefore = true;
		}
		step(lexer);

		flags = char2Flag[lexer.char] || 0;
	}

	if (lexer.char === Char.EndOfFile) {
		return;
	}

	lexer.start = lexer.end;
	lexer.token = Token.Unknown;

	if ((flags & CharFlags.IdStart) === CharFlags.IdStart) {
		return scanIdentifier(lexer);
	} else if ((flags & CharFlags.Number) === CharFlags.Number) {
		return parseNumericLiteralOrDot(lexer);
	} else if ((flags & CharFlags.Direct) === CharFlags.Direct) {
		// Codes are synched with Token
		lexer.token = lexer.char as any;
		step(lexer);
		return;
	}

	switch (lexer.char) {
		case Char["#"]:
			// Hashbang
			if (lexer.i === 1 && lexer.source.startsWith("#!")) {
				// "#!/usr/bin/env node"
				lexer.token = Token.Hashbang;
				hashbang: while (true) {
					step(lexer);
					switch (lexer.char as number) {
						case Char["\r"]:
						case Char.NewLine:
						case Char["\u2028"]:
						case Char["\u2029"]:
							break hashbang;
						case Char.EndOfFile:
							break hashbang;
					}
				}
				lexer.identifier = getRaw(lexer);
			} else {
				// TOOD: Private fields
			}
			break;

		case Char.QuestionMark:
			// '?' or '?.' or '??' or '??='
			step(lexer);
			switch (lexer.char as number) {
				case Char.QuestionMark:
					step(lexer);
					switch (lexer.char as number) {
						case Char.Equal:
							step(lexer);
							lexer.token = Token["??="];
							break;
						default:
							lexer.token = Token["??"];
					}
					break;
				case Char.Dot:
					lexer.token = Token["?"];
					let current = lexer.i;
					let contents = lexer.source;

					// Lookahead to disambiguate with 'a?.1:b'
					if (current < contents.length) {
						let c = contents.charCodeAt(current)!;
						if (c < Char.n0 || c > Char.n9) {
							step(lexer);
							lexer.token = Token["?."];
						}
					}
					break;
				default:
					lexer.token = Token["?"];
			}
			break;

		case Char.Percent:
			// '%' or '%='
			step(lexer);
			switch (lexer.char as number) {
				case Char.Equal:
					step(lexer);
					lexer.token = Token["%="];
					break;
				default:
					lexer.token = Token["%"];
			}
			break;

		case Char.Ampersand:
			// '&' or '&=' or '&&' or '&&='
			step(lexer);
			switch (lexer.char as number) {
				case Char.Equal:
					step(lexer);
					lexer.token = Token["&="];
					break;
				case Char.Ampersand:
					step(lexer);
					switch (lexer.char as number) {
						case Char.Equal:
							step(lexer);
							lexer.token = Token["&&="];
							break;
						default:
							lexer.token = Token["&&"];
					}
					break;
				default:
					lexer.token = Token["&"];
			}
			break;

		case Char.Pipe:
			// '|' or '|=' or '||' or '||='
			step(lexer);
			switch (lexer.char as number) {
				case Char.Equal:
					step(lexer);
					lexer.token = Token["|="];
					break;
				case Char.Pipe:
					step(lexer);
					switch (lexer.char as number) {
						case Char.Equal:
							step(lexer);
							lexer.token = Token["||="];
							break;
						default:
							lexer.token = Token["||"];
					}
					break;
				default:
					lexer.token = Token["|"];
			}

			break;

		case Char.Circonflex:
			// '^' or '^='
			step(lexer);
			switch (lexer.char as number) {
				case Char.Equal:
					step(lexer);
					lexer.token = Token["^="];
					break;
				default:
					lexer.token = Token["^"];
			}
			break;

		case Char.Plus:
			// '+' or '+=' or '++'
			step(lexer);
			switch (lexer.char as number) {
				case Char.Equal:
					step(lexer);
					lexer.token = Token["+="];
					break;
				case Char.Plus:
					step(lexer);
					lexer.token = Token["++"];
					break;
				default:
					lexer.token = Token["+"];
			}
			break;

		case Char.Minus:
			// '-' or '-=' or '--'
			step(lexer);
			switch (lexer.char as number) {
				case Char.Equal:
					step(lexer);
					lexer.token = Token["-="];
					break;
				case Char.Minus:
					step(lexer);

					lexer.token = Token["--"];
					break;
				default:
					lexer.token = Token["-"];
			}
			break;

		case Char.Asteriks:
			// '*' or '*=' or '**' or '**='
			step(lexer);
			switch (lexer.char as number) {
				case Char.Equal:
					step(lexer);
					lexer.token = Token["*="];
					break;

				case Char.Asteriks:
					step(lexer);
					if ((lexer.char as number) === Char.Equal) {
						step(lexer);
						lexer.token = Token["**="];
					} else {
						lexer.token = Token["**"];
					}
					break;
				default:
					lexer.token = Token["*"];
			}

			break;

		case Char.Slash:
			// '/' or '/=' or '//' or '/* ... */'
			step(lexer);
			switch (lexer.char as number) {
				case Char.Equal: {
					step(lexer);
					lexer.token = Token["/="];
					break;
				}
				case Char.Slash: {
					singleLineComment: while (true) {
						step(lexer);
						switch (lexer.char as number) {
							case Char["\r"]:
							case Char.NewLine:
							case Char["\u2028"]:
							case Char["\u2029"]:
							case Char.EndOfFile:
								break singleLineComment;
						}
					}
					scanCommentText(lexer);
					return;
				}
				case Char.Asteriks: {
					step(lexer);
					multiLineComment: while (true) {
						switch (lexer.char as number) {
							case Char.Asteriks: {
								step(lexer);
								if (lexer.char === Char.Slash) {
									step(lexer);
									break multiLineComment;
								}
								break;
							}
							case Char["\r"]:
							case Char.NewLine:
							case Char["\u2028"]:
							case Char["\u2029"]:
							case Char.EndOfFile: {
								step(lexer);
								lexer.hasNewLineBefore = true;
								break;
							}
							case Char.EndOfFile: {
								lexer.start = lexer.end;
								throw new Error("Unterminated multiline comment");
							}
							default:
								step(lexer);
						}
					}
					scanCommentText(lexer);
					return;
				}
				default:
					lexer.token = Token["/"];
			}
			break;

		case Char.Equal:
			// '=' or '=>' or '==' or '==='
			step(lexer);
			switch (lexer.char as number) {
				case Char.GreaterThan:
					step(lexer);
					lexer.token = Token["=>"];
					break;
				case Char.Equal:
					step(lexer);
					if (lexer.char === Char.Equal) {
						step(lexer);
						lexer.token = Token["==="];
					} else {
						lexer.token = Token["=="];
					}
					break;
				default:
					lexer.token = Token["-"];
			}

			break;

		case Char.LessThan:
			// '<' or '<<' or '<=' or '<<=' or '<!--'
			step(lexer);
			switch (lexer.char as number) {
				case Char.Equal:
					step(lexer);
					lexer.token = Token["<="];
					break;
				case Char.LessThan:
					step(lexer);
					if ((lexer.char as number) === Char.Equal) {
						step(lexer);
						lexer.token = Token["<<="];
					} else {
						lexer.token = Token["<<"];
					}
					break;
				default:
					lexer.token = Token["<"];
			}
			break;

		case Char.Bang:
			// '!' or '!=' or '!=='
			step(lexer);

			// != or !==
			if ((lexer.char as number) === Char.Equal) {
				step(lexer);
				if ((lexer.char as number) === Char.Equal) {
					step(lexer);
					lexer.token = Token["!=="];
				} else {
					lexer.token = Token["!="];
				}
			} else {
				lexer.token = Token["!"];
			}
			break;

		case Char.GreaterThan:
			// '>' or '>>' or '>>>' or '>=' or '>>=' or '>>>='
			step(lexer);
			switch (lexer.char as number) {
				case Char.Equal:
					step(lexer);
					lexer.token = Token[">="];
					break;
				case Char.GreaterThan:
					step(lexer);
					switch (lexer.char as number) {
						case Char.Equal:
							step(lexer);
							lexer.token = Token[">>="];
							break;
						case Char.GreaterThan:
							step(lexer);
							lexer.token = Token[">>>"];
							break;
						default:
							lexer.token = Token[">>"];
					}
					break;
				default:
					lexer.token = Token[">"];
			}

			break;

		case Char.Quote:
		case Char.DoubleQuote:
		case Char.Backtick: {
			const quote = lexer.char;
			let hasEscape = false;
			let suffixLen = 1;
			let isASCII = true;

			if (quote !== Char.Backtick) {
				lexer.token = Token.StringLiteral;
			} else if (lexer.rescanCloseBraceAsTemplateToken) {
				lexer.token = Token.TemplateTail;
			} else {
				lexer.token = Token.NoSubstitutionTemplateLiteral;
			}
			step(lexer);

			stringLiteral: while (true) {
				switch (lexer.char as number) {
					case Char.Backtick:
						hasEscape = true;
						step(lexer);

						// Handle Windows CRLF
						// if ((lexer.char as number) === CodePoint['\r'] && !lexer.json.parse) {
						if ((lexer.char as number) === Char["\r"]) {
							step(lexer);
							if ((lexer.char as number) == Char.NewLine) {
								step(lexer);
							}
							continue;
						}

					case -1: // This indicates the end of the file
						throwSyntaxError(lexer);

					case Char["\r"]:
					case Char.NewLine:
						if (quote !== Char.Backtick) {
							addError(lexer, lexer.end, "Unterminated string literal");
							throw new Error("PANIC");
						}

					case Char.$:
						if (quote === Char.Backtick) {
							step(lexer);
							if ((lexer.char as number) === Char["{"]) {
								suffixLen = 2;
								step(lexer);
								if (lexer.rescanCloseBraceAsTemplateToken) {
									lexer.token = Token.TemplateMiddle;
								} else {
									lexer.token = Token.TemplateHead;
								}
								break stringLiteral;
							}
							continue stringLiteral;
						}

					case quote:
						step(lexer);
						break stringLiteral;

					default:
						// Non-ASCII strings need the slow path
						if (lexer.char >= 0x80) {
							isASCII = false;
							// } else if (lexer.json.parse && lexer.codePoint < 0x20) {
							// 	lexer.SyntaxError()
						}
				}
				step(lexer);
			}

			const text = lexer.source.slice(lexer.start + 1, lexer.end - suffixLen);

			if (hasEscape || !isASCII) {
				// Slow path
				lexer.string = decodeEscapeSequences(lexer, lexer.start + 1, text);
			} else {
				lexer.string = text;
			}

			// if (quote == '\'' && lexer.json.parse) {
			// 	lexer.addRangeError(lexer.Range(), "JSON strings must use double quotes")
			// }

			break;
		}

		case Char.DoubleBackSlash:
			// lexer.Identifier,
			// 	(lexer.Token = lexer.scanIdentifierWithEscapes(normalIdentifier));
			throw new Error("Escaped Identifiers are not supported yet");

		default:
			if (isIdentifierStart(lexer.char)) {
				step(lexer);

				while (isIdentifierContinue(lexer.char)) {
					step(lexer);
				}

				// TODO: Identifiers can have escape chars
				lexer.token = Token.Identifier;
				lexer.identifier = getRaw(lexer);
				break;
			}

			lexer.end = lexer.i;
			lexer.token = Token.SyntaxError;
	}
}
