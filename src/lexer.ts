import { Token, keywords } from "./tokens";
import * as logger from "./logger";
import {
	isIdentifierStart,
	isIdentifierContinue,
	isWhitespace,
	CodePoint,
	IdenitfierKind,
	isHexChar,
	isIdentifier,
	isKeyword,
} from "./lexer_helpers";

export interface Lexer {
	i: number;
	codePoint: number;
	source: string;
	hasNewLineBefore: boolean;
	token: Token;
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

export function newLexer(source: string): Lexer {
	const lexer = {
		i: 0,
		codePoint: -1,
		source,
		hasNewLineBefore: false,
		rescanCloseBraceAsTemplateToken: false,
		token: 0,
		number: 0,
		string: "",
		identifier: "",
		commentBefore: null,
		start: -1,
		end: -1,
		isLogDisabled: false,
		logger: {
			logs: [],
		},
	};

	step(lexer);
	nextToken(lexer);

	return lexer;
}

function step(lexer: Lexer) {
	lexer.codePoint =
		lexer.i < lexer.source.length ? lexer.source.codePointAt(lexer.i)! : -1;
	lexer.end = lexer.i;
	lexer.i++;
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
		let c = lexer.source.codePointAt(lexer.end)!;
		if (c < 0x20) {
			message = `Syntax error \"\\x${c}02X\"`;
		} else if (c >= 0x80) {
			message = `Syntax error \"\\u{${c}x}\"`;
		} else if (c !== CodePoint.DoubleQuote) {
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
	const first = lexer.codePoint;
	step(lexer);

	// Dot without a digit after it
	if (
		first === CodePoint.Dot &&
		(lexer.codePoint < CodePoint.n0 || lexer.codePoint > CodePoint.n9)
	) {
		// "..."
		if (
			lexer.codePoint === CodePoint.Dot &&
			lexer.i < lexer.source.length &&
			lexer.source[lexer.i] == "."
		) {
			step(lexer);
			step(lexer);
			lexer.token = Token.DotDotDot;
			return;
		}

		// "."
		lexer.token = Token.Dot;
		return;
	}

	let underscoreCount = 0;
	let lastUnderscoreEnd = 0;
	let hasDotOrExponent = first === CodePoint.Dot;
	let isLegacyOctalLiteral = false;
	let base = 0;

	// Assume this is a number, but potentially change to a bigint later
	lexer.token = Token.NumericLiteral;

	// Check for binary, octal, or hexadecimal literal
	if (first === CodePoint.n0) {
		switch (lexer.codePoint) {
			case CodePoint.b:
			case CodePoint.B:
				base = 2;
				break;

			case CodePoint.o:
			case CodePoint.O:
				base = 8;
				break;

			case CodePoint.x:
			case CodePoint.X:
				base = 16;
				break;

			case CodePoint.n0:
			case CodePoint.n1:
			case CodePoint.n2:
			case CodePoint.n3:
			case CodePoint.n4:
			case CodePoint.n5:
			case CodePoint.n6:
			case CodePoint.n7:
				base = 8;
				isLegacyOctalLiteral = true;
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
			switch (lexer.codePoint) {
				case CodePoint._:
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
				case CodePoint.n0:
				case CodePoint.n1:
					lexer.number = lexer.number * base + (lexer.codePoint - CodePoint.n0);
					break;
				case CodePoint.n2:
				case CodePoint.n3:
				case CodePoint.n4:
				case CodePoint.n5:
				case CodePoint.n6:
				case CodePoint.n7:
					if (base == 2) {
						throwSyntaxError(lexer);
					}
					lexer.number = lexer.number * base + (lexer.codePoint - CodePoint.n0);
					break;
				case CodePoint.n8:
				case CodePoint.n9:
					if (isLegacyOctalLiteral) {
						isInvalidLegacyOctalLiteral = true;
					} else if (base < 10) {
						throwSyntaxError(lexer);
					}
					lexer.number = lexer.number * base + (lexer.codePoint - CodePoint.n0);

					break;
				case CodePoint.A:
				case CodePoint.B:
				case CodePoint.C:
				case CodePoint.D:
				case CodePoint.E:
				case CodePoint.F:
					if (base !== 16) {
						throwSyntaxError(lexer);
					}
					lexer.number =
						lexer.number * base + (lexer.codePoint + 10 - CodePoint.A);
					break;
				case CodePoint.a:
				case CodePoint.b:
				case CodePoint.c:
				case CodePoint.d:
				case CodePoint.e:
				case CodePoint.f:
					if (base !== 16) {
						throwSyntaxError(lexer);
					}
					lexer.number =
						lexer.number * base + (lexer.codePoint + 10 - CodePoint.a);
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

		let isBigIntegerLiteral =
			lexer.codePoint === CodePoint.n && !hasDotOrExponent;

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
			if (lexer.codePoint < CodePoint.n0 || lexer.codePoint > CodePoint.n9) {
				if (lexer.codePoint !== CodePoint._) {
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
		if (first !== CodePoint.Dot && lexer.codePoint === CodePoint.Dot) {
			// An underscore must not come last
			if (lastUnderscoreEnd > 0 && lexer.end == lastUnderscoreEnd + 1) {
				lexer.end--;
				throwSyntaxError(lexer);
			}

			hasDotOrExponent = true;
			step(lexer);
			while (true) {
				if (lexer.codePoint < CodePoint.n0 || lexer.codePoint > CodePoint.n9) {
					if ((lexer.codePoint as number) !== CodePoint._) {
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
		if (lexer.codePoint === CodePoint.e || lexer.codePoint == CodePoint.E) {
			// An underscore must not come last
			if (lastUnderscoreEnd > 0 && lexer.end == lastUnderscoreEnd + 1) {
				lexer.end--;
				throwSyntaxError(lexer);
			}

			hasDotOrExponent = true;
			step(lexer);
			if (
				(lexer.codePoint as number) === CodePoint.Plus ||
				(lexer.codePoint as number) === CodePoint.Minus
			) {
				step(lexer);
			}
			if (lexer.codePoint < CodePoint.n0 || lexer.codePoint > CodePoint.n9) {
				throwSyntaxError(lexer);
			}
			while (true) {
				if (lexer.codePoint < CodePoint.n0 || lexer.codePoint > CodePoint.n9) {
					if ((lexer.codePoint as number) !== CodePoint._) {
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

		if (lexer.codePoint === CodePoint.n && !hasDotOrExponent) {
			// The only bigint literal that can start with 0 is "0n"
			if (text.length > 1 && first === CodePoint.n0) {
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
	if (lexer.codePoint === CodePoint.n && !hasDotOrExponent) {
		lexer.token = Token.BigIntLiteral;
		step(lexer);
	}

	// Identifiers can't occur immediately after numbers
	if (isIdentifierStart(lexer.codePoint)) {
		throwSyntaxError(lexer);
	}
}

function scanIdentifierWithEscapes(lexer: Lexer, kind: IdenitfierKind) {
	// First pass: scan over the identifier to see how long it is
	while (true) {
		// FIXME: Double backslash?
		if (lexer.codePoint === CodePoint.BackSlash) {
			step(lexer);
			// @ts-ignore
			if (lexer.codePoint !== CodePoint.u) {
				throwSyntaxError(lexer);
			}

			step(lexer);
			// @ts-ignore
			if (lexer.codePoint === CodePoint["{"]) {
				step(lexer);
				// @ts-ignore
				while (lexer.codePoint !== CodePoint["}"]) {
					if (isHexChar(lexer.codePoint)) {
						step(lexer);
					} else {
						throwSyntaxError(lexer);
					}
				}

				step(lexer);
			} else {
				for (let i = 0; i < 4; i++) {
					if (isHexChar(lexer.codePoint)) {
						step(lexer);
					} else {
						throwSyntaxError(lexer);
					}
				}
			}

			continue;
		}

		if (!isIdentifierContinue(lexer.codePoint)) {
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
		let c = text.codePointAt(i)!;

		if (c === CodePoint.BackSlash && i + 1 < text.length) {
			let c2 = text.codePointAt(i + 1)!;
			i += 1;

			switch (c2) {
				case CodePoint.b:
					decoded += "\b";
					continue;
				case CodePoint.f:
					decoded += "\f";
					continue;
				case CodePoint.n:
					decoded += "\n";
					continue;
				case CodePoint.r:
					decoded += "\r";
					continue;
				case CodePoint.t:
					decoded += "\t";
					continue;

				case CodePoint.v:
					// if lexer.json.parse {
					// 	lexer.end = start + i - width2
					// 	lexer.SyntaxError()
					// }

					decoded += "\v";
					continue;

				case CodePoint.n0:
				case CodePoint.n1:
				case CodePoint.n2:
				case CodePoint.n3:
				case CodePoint.n4:
				case CodePoint.n5:
				case CodePoint.n6:
				case CodePoint.n7:
					// if lexer.json.parse {
					// 	lexer.end = start + i - width2
					// 	lexer.SyntaxError()
					// }

					// 1-3 digit octal
					let value = c2 - CodePoint.n0;
					let c3 = text.codePointAt(i + 1)!;
					switch (c3) {
						case CodePoint.n0:
						case CodePoint.n1:
						case CodePoint.n2:
						case CodePoint.n3:
						case CodePoint.n4:
						case CodePoint.n5:
						case CodePoint.n6:
						case CodePoint.n7:
							value = value * 8 + c3 - CodePoint.n0;
							i += 1;
							let c4 = text.codePointAt(i + 1)!;
							switch (c4) {
								case CodePoint.n0:
								case CodePoint.n1:
								case CodePoint.n2:
								case CodePoint.n3:
								case CodePoint.n4:
								case CodePoint.n5:
								case CodePoint.n6:
								case CodePoint.n7:
									let temp = value * 8 + c4 - CodePoint.n0;
									if (temp < 256) {
										value = temp;
										i += 1;
									}
							}
					}
					c = value;
					break;
				case CodePoint.x:
					// if lexer.json.parse {
					// 	lexer.end = start + i - width2
					// 	lexer.SyntaxError()
					// }

					// 2-digit hexadecimal
					value = 0;
					for (let j = 0; j < 2; j++) {
						let c3 = text.codePointAt(i)!;
						i += 1;
						switch (c3) {
							case CodePoint.n0:
							case CodePoint.n1:
							case CodePoint.n2:
							case CodePoint.n3:
							case CodePoint.n4:
							case CodePoint.n5:
							case CodePoint.n6:
							case CodePoint.n7:
							case CodePoint.n8:
							case CodePoint.n9:
								value = (value * 16) | (c3 - CodePoint.n0);
								break;
							case CodePoint.a:
							case CodePoint.b:
							case CodePoint.c:
							case CodePoint.d:
							case CodePoint.e:
							case CodePoint.f:
								value = (value * 16) | (c3 + 10 - CodePoint.a);
								break;
							case CodePoint.A:
							case CodePoint.B:
							case CodePoint.C:
							case CodePoint.D:
							case CodePoint.E:
							case CodePoint.F:
								value = (value * 16) | (c3 + 10 - CodePoint.A);
								break;
							default:
								lexer.end = start + i - 1;
								throwSyntaxError(lexer);
						}
					}
					c = value;
					break;
				case CodePoint.u: {
					// Unicode
					let value = 0;

					// Check the first character
					i += 1;
					let c3 = text.codePointAt(i)!;

					// Afaik string.slice() does an allocation. We could probably
					// improve perf by rewriting this section and do the
					// conversion by hand like esbuild does, but this is easier
					// to maintain.
					if (c3 === CodePoint["{"]) {
						i += 1;
						const start = i;
						while (text.codePointAt(i) !== CodePoint["}"]) {
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
				case CodePoint["\r"]:
					// Ignore line continuations. A line continuation is not an escaped newline.
					if (i < text.length && text[i] == "\n") {
						// Make sure Windows CRLF counts as a single newline
						i++;
					}
					continue;

				case CodePoint.NewLine:
				case CodePoint["\u2028"]:
				case CodePoint["\u2029"]:
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
		switch (lexer.codePoint) {
			case CodePoint.Slash: {
				step(lexer);

				while (isIdentifierContinue(lexer.codePoint)) {
					switch (lexer.codePoint as number) {
						case CodePoint.g:
						case CodePoint.i:
						case CodePoint.m:
						case CodePoint.s:
						case CodePoint.u:
						case CodePoint.y: {
							step(lexer);
							break;
						}
						default:
							throw new SyntaxError("Unexpected token in RegExp");
					}
				}
				return;
			}
			default:
				step(lexer);
		}
	}
}

function scanCommentText(lexer: Lexer) {
	const text = lexer.source.slice(lexer.start, lexer.end);
	if (!lexer.commentBefore) {
		lexer.commentBefore = [];
	}
	lexer.commentBefore.push(text);
}

export function nextToken(lexer: Lexer) {
	lexer.hasNewLineBefore = lexer.end === 0;

	while (true) {
		lexer.start = lexer.end;
		lexer.token = 0;

		switch (lexer.codePoint) {
			case CodePoint.EndOfFile:
				lexer.token = Token.EndOfFile;
				break;
			case CodePoint["#"]:
				// Hashbang
				if (lexer.i === 1 && lexer.source.startsWith("#!")) {
					// "#!/usr/bin/env node"
					lexer.token = Token.Hashbang;
					hashbang: while (true) {
						step(lexer);
						switch (lexer.codePoint as number) {
							case CodePoint["\r"]:
							case CodePoint.NewLine:
							case CodePoint["\u2028"]:
							case CodePoint["\u2029"]:
								break hashbang;
							case CodePoint.EndOfFile:
								break hashbang;
						}
					}
					lexer.identifier = getRaw(lexer);
				} else {
					// TOOD: Private fields
				}
				break;

			case CodePoint["\r"]:
			case CodePoint.NewLine:
			case CodePoint["\u2028"]:
			case CodePoint["\u2029"]:
				step(lexer);
				lexer.hasNewLineBefore = true;
				continue;

			case CodePoint.Tab:
			case CodePoint.Space:
				step(lexer);
				continue;

			case CodePoint["("]:
				step(lexer);
				lexer.token = Token.OpenParen;
				break;

			case CodePoint[")"]:
				step(lexer);
				lexer.token = Token.CloseParen;
				break;

			case CodePoint["["]:
				step(lexer);
				lexer.token = Token.OpenBracket;
				break;

			case CodePoint["]"]:
				step(lexer);
				lexer.token = Token.CloseBracket;
				break;

			case CodePoint["{"]:
				step(lexer);
				lexer.token = Token.OpenBrace;
				break;

			case CodePoint["}"]:
				step(lexer);
				lexer.token = Token.CloseBrace;
				break;

			case CodePoint.Comma:
				step(lexer);
				lexer.token = Token.Comma;
				break;

			case CodePoint.Colon:
				step(lexer);
				lexer.token = Token.Colon;
				break;

			case CodePoint.SemiColon:
				step(lexer);
				lexer.token = Token.SemiColon;
				break;

			case CodePoint.At:
				step(lexer);
				lexer.token = Token.At;
				break;

			case CodePoint.Tilde:
				step(lexer);
				lexer.token = Token.Tilde;
				break;

			case CodePoint.QuestionMark:
				// '?' or '?.' or '??' or '??='
				step(lexer);
				switch (lexer.codePoint as number) {
					case CodePoint.QuestionMark:
						step(lexer);
						switch (lexer.codePoint as number) {
							case CodePoint.Equal:
								step(lexer);
								lexer.token = Token["??="];
								break;
							default:
								lexer.token = Token["??"];
						}
						break;
					case CodePoint.Dot:
						lexer.token = Token.Question;
						let current = lexer.i;
						let contents = lexer.source;

						// Lookahead to disambiguate with 'a?.1:b'
						if (current < contents.length) {
							let c = contents.codePointAt(current)!;
							if (c < CodePoint.n0 || c > CodePoint.n9) {
								step(lexer);
								lexer.token = Token.QuestionDot;
							}
						}
						break;
					default:
						lexer.token = Token.Question;
				}
				break;

			case CodePoint.Percent:
				// '%' or '%='
				step(lexer);
				switch (lexer.codePoint as number) {
					case CodePoint.Equal:
						step(lexer);
						lexer.token = Token.PercentEquals;
						break;
					default:
						lexer.token = Token.Percent;
				}
				break;

			case CodePoint.Ampersand:
				// '&' or '&=' or '&&' or '&&='
				step(lexer);
				switch (lexer.codePoint as number) {
					case CodePoint.Equal:
						step(lexer);
						lexer.token = Token["&="];
						break;
					case CodePoint.Ampersand:
						step(lexer);
						switch (lexer.codePoint as number) {
							case CodePoint.Equal:
								step(lexer);
								lexer.token = Token["&&="];
								break;
							default:
								lexer.token = Token["&&"];
						}
						break;
					default:
						lexer.token = Token.Ampersand;
				}
				break;

			case CodePoint.Pipe:
				// '|' or '|=' or '||' or '||='
				step(lexer);
				switch (lexer.codePoint as number) {
					case CodePoint.Equal:
						step(lexer);
						lexer.token = Token["|="];
						break;
					case CodePoint.Pipe:
						step(lexer);
						switch (lexer.codePoint as number) {
							case CodePoint.Equal:
								step(lexer);
								lexer.token = Token["||="];
								break;
							default:
								lexer.token = Token["||"];
						}
						break;
					default:
						lexer.token = Token.Bar;
				}

				break;

			case CodePoint.Circonflex:
				// '^' or '^='
				step(lexer);
				switch (lexer.codePoint as number) {
					case CodePoint.Equal:
						step(lexer);
						lexer.token = Token["^="];
						break;
					default:
						lexer.token = Token.Caret;
				}
				break;

			case CodePoint.Plus:
				// '+' or '+=' or '++'
				step(lexer);
				switch (lexer.codePoint as number) {
					case CodePoint.Equal:
						step(lexer);
						lexer.token = Token["+="];
						break;
					case CodePoint.Plus:
						step(lexer);
						lexer.token = Token["++"];
						break;
					default:
						lexer.token = Token.Plus;
				}
				break;

			case CodePoint.Minus:
				// '-' or '-=' or '--' or '-->'
				step(lexer);
				switch (lexer.codePoint as number) {
					case CodePoint.Equal:
						step(lexer);
						lexer.token = Token["-="];
						break;
					case CodePoint.Minus:
						step(lexer);

						// Handle legacy HTML-style comments
						if (
							(lexer.codePoint as number) === CodePoint.GreaterThan &&
							lexer.hasNewLineBefore
						) {
							step(lexer);
							// lexer.log.AddRangeWarning(&lexer.source, lexer.Range(),
							// 	"Treating \"-->\" as the start of a legacy HTML single-line comment")
							singleLineHTMLCloseComment: while (true) {
								switch (lexer.codePoint as number) {
									case CodePoint["\r"]:
									case CodePoint.NewLine:
									case CodePoint["\u2028"]:
									case CodePoint["\u2029"]:
										break singleLineHTMLCloseComment;

									case -1: // This indicates the end of the file
										break singleLineHTMLCloseComment;
								}
								step(lexer);
							}
							continue;
						}

						lexer.token = Token["--"];
						break;
					default:
						lexer.token = Token.Minus;
				}
				break;

			case CodePoint.Asteriks:
				// '*' or '*=' or '**' or '**='
				step(lexer);
				switch (lexer.codePoint as number) {
					case CodePoint.Equal:
						step(lexer);
						lexer.token = Token["*="];

					case CodePoint.Asteriks:
						step(lexer);
						if ((lexer.codePoint as number) === CodePoint.Equal) {
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

			case CodePoint.Slash:
				// '/' or '/=' or '//' or '/* ... */'
				step(lexer);
				switch (lexer.codePoint as number) {
					case CodePoint.Equal: {
						step(lexer);
						lexer.token = Token["/="];
						break;
					}
					case CodePoint.Slash: {
						singleLineComment: while (true) {
							step(lexer);
							switch (lexer.codePoint as number) {
								case CodePoint["\r"]:
								case CodePoint.NewLine:
								case CodePoint["\u2028"]:
								case CodePoint["\u2029"]:
								case CodePoint.EndOfFile:
									break singleLineComment;
							}
						}
						scanCommentText(lexer);
						continue;
					}
					case CodePoint.Asteriks: {
						step(lexer);
						multiLineComment: while (true) {
							switch (lexer.codePoint as number) {
								case CodePoint.Asteriks: {
									step(lexer);
									if (lexer.codePoint === CodePoint.Slash) {
										step(lexer);
										break multiLineComment;
									}
									break;
								}
								case CodePoint["\r"]:
								case CodePoint.NewLine:
								case CodePoint["\u2028"]:
								case CodePoint["\u2029"]:
								case CodePoint.EndOfFile: {
									step(lexer);
									lexer.hasNewLineBefore = true;
									break;
								}
								case CodePoint.EndOfFile: {
									lexer.start = lexer.end;
									throw new Error("Unterminated multiline comment");
								}
								default:
									step(lexer);
							}
						}
						scanCommentText(lexer);
						continue;
					}
					default:
						lexer.token = Token["/"];
				}
				break;

			case CodePoint.Equal:
				// '=' or '=>' or '==' or '==='
				step(lexer);
				switch (lexer.codePoint as number) {
					case CodePoint.GreaterThan:
						step(lexer);
						lexer.token = Token["=>"];
						break;
					case CodePoint.Equal:
						step(lexer);
						if (lexer.codePoint === CodePoint.Equal) {
							step(lexer);
							lexer.token = Token["==="];
						} else {
							lexer.token = Token["=="];
						}
						break;
					default:
						lexer.token = Token.Equals;
				}

				break;

			case CodePoint.LessThan:
				// '<' or '<<' or '<=' or '<<=' or '<!--'
				step(lexer);
				switch (lexer.codePoint as number) {
					case CodePoint.Equal:
						step(lexer);
						lexer.token = Token["<="];
						break;
					case CodePoint.LessThan:
						step(lexer);
						if ((lexer.codePoint as number) === CodePoint.Equal) {
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

			case CodePoint.Bang:
				// '!' or '!=' or '!=='
				step(lexer);

				// != or !==
				if ((lexer.codePoint as number) === CodePoint.Equal) {
					step(lexer);
					if ((lexer.codePoint as number) === CodePoint.Equal) {
						step(lexer);
						lexer.token = Token["!=="];
					} else {
						lexer.token = Token["!="];
					}
				} else {
					lexer.token = Token["!"];
				}
				break;

			case CodePoint.GreaterThan:
				// '>' or '>>' or '>>>' or '>=' or '>>=' or '>>>='
				step(lexer);
				switch (lexer.codePoint as number) {
					case CodePoint.Equal:
						step(lexer);
						lexer.token = Token[">="];
						break;
					case CodePoint.GreaterThan:
						step(lexer);
						switch (lexer.codePoint as number) {
							case CodePoint.Equal:
								step(lexer);
								lexer.token = Token[">>="];
								break;
							case CodePoint.GreaterThan:
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

			case CodePoint.Quote:
			case CodePoint.DoubleQuote:
			case CodePoint.Backtick: {
				const quote = lexer.codePoint;
				let hasEscape = false;
				let suffixLen = 1;
				let isASCII = true;

				if (quote !== CodePoint.Backtick) {
					lexer.token = Token.StringLiteral;
				} else if (lexer.rescanCloseBraceAsTemplateToken) {
					lexer.token = Token.TemplateTail;
				} else {
					lexer.token = Token.NoSubstitutionTemplateLiteral;
				}
				step(lexer);

				stringLiteral: while (true) {
					switch (lexer.codePoint as number) {
						case CodePoint.Backtick:
							hasEscape = true;
							step(lexer);

							// Handle Windows CRLF
							// if ((lexer.codePoint as number) === CodePoint['\r'] && !lexer.json.parse) {
							if ((lexer.codePoint as number) === CodePoint["\r"]) {
								step(lexer);
								if ((lexer.codePoint as number) == CodePoint.NewLine) {
									step(lexer);
								}
								continue;
							}

						case -1: // This indicates the end of the file
							throwSyntaxError(lexer);

						case CodePoint["\r"]:
						case CodePoint.NewLine:
							if (quote !== CodePoint.Backtick) {
								addError(lexer, lexer.end, "Unterminated string literal");
								throw new Error("PANIC");
							}

						case CodePoint.$:
							if (quote === CodePoint.Backtick) {
								step(lexer);
								if ((lexer.codePoint as number) === CodePoint["{"]) {
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
							if (lexer.codePoint >= 0x80) {
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
			case CodePoint._:
			case CodePoint.$:
			case CodePoint.a:
			case CodePoint.b:
			case CodePoint.c:
			case CodePoint.d:
			case CodePoint.e:
			case CodePoint.f:
			case CodePoint.g:
			case CodePoint.h:
			case CodePoint.i:
			case CodePoint.j:
			case CodePoint.k:
			case CodePoint.l:
			case CodePoint.m:
			case CodePoint.n:
			case CodePoint.o:
			case CodePoint.p:
			case CodePoint.q:
			case CodePoint.r:
			case CodePoint.s:
			case CodePoint.t:
			case CodePoint.u:
			case CodePoint.v:
			case CodePoint.w:
			case CodePoint.x:
			case CodePoint.y:
			case CodePoint.z:
			case CodePoint.A:
			case CodePoint.B:
			case CodePoint.C:
			case CodePoint.D:
			case CodePoint.E:
			case CodePoint.F:
			case CodePoint.G:
			case CodePoint.H:
			case CodePoint.I:
			case CodePoint.J:
			case CodePoint.K:
			case CodePoint.L:
			case CodePoint.M:
			case CodePoint.N:
			case CodePoint.O:
			case CodePoint.P:
			case CodePoint.Q:
			case CodePoint.R:
			case CodePoint.S:
			case CodePoint.T:
			case CodePoint.U:
			case CodePoint.V:
			case CodePoint.W:
			case CodePoint.X:
			case CodePoint.Y:
			case CodePoint.Z:
				step(lexer);

				while (isIdentifierContinue(lexer.codePoint)) {
					step(lexer);
				}

				// TODO: Escape chars
				// TODO: Double backslash?
				// @ts-ignore
				if (lexer.codePoint === CodePoint.BackSlash) {
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
				break;

			case CodePoint.DoubleBackSlash:
				// lexer.Identifier,
				// 	(lexer.Token = lexer.scanIdentifierWithEscapes(normalIdentifier));
				throw new Error("Escaped Identifiers are not supported yet");

			case CodePoint.Dot:
			case CodePoint.n0:
			case CodePoint.n1:
			case CodePoint.n2:
			case CodePoint.n3:
			case CodePoint.n4:
			case CodePoint.n5:
			case CodePoint.n6:
			case CodePoint.n7:
			case CodePoint.n8:
			case CodePoint.n9:
				parseNumericLiteralOrDot(lexer);
				break;

			default:
				if (isWhitespace(lexer.codePoint)) {
					step(lexer);
					continue;
				}

				if (isIdentifierStart(lexer.codePoint)) {
					step(lexer);

					while (isIdentifierContinue(lexer.codePoint)) {
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

		return;
	}
}
