import { Token, keywords } from "./tokens";
import * as logger from "./logger";

import {
	isIdentifierContinue,
	isWhitespace,
	Char,
	IdenitfierKind,
	isHexChar,
	isIdentifier,
	isKeyword,
	formatLexerPosition,
	char2Token,
} from "./lexer_helpers";
import { parseNumericLiteralOrDot } from "./lexer/numeric-literal";
import { scanIdentifier, scanMaybeIdentifier } from "./lexer/identifier";

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
		i: -1,
		codePoint: -1,
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
		isLogDisabled: false,
		logger: {
			logs: [],
		},
	};

	step(lexer);
	nextToken(lexer);

	return lexer;
}

export function step(lexer: Lexer) {
	const { source } = lexer;
	lexer.i++;
	const ch =
		lexer.i < source.length ? source.charCodeAt(lexer.i) : Char.EndOfFile;

	return (lexer.codePoint = ch);
}

function addError(lexer: Lexer, loc: number, text: string) {
	if (!lexer.isLogDisabled) {
		logger.addError(lexer.logger, lexer.source, loc, text);
	}
}

export function getRaw(lexer: Lexer) {
	return lexer.source.slice(lexer.start, lexer.i);
}

export function throwSyntaxError(lexer: Lexer) {
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

		message += String.fromCharCode(c);
	}
	addError(lexer, loc, message);
	throw new SyntaxError(message);
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

function scanIdentifierWithEscapes(
	lexer: Lexer,
	ch: number,
	kind: IdenitfierKind
) {
	// First pass: scan over the identifier to see how long it is
	while (true) {
		// FIXME: Double backslash?
		if (ch === Char.BackSlash) {
			ch = step(lexer);
			// @ts-ignore
			if (ch !== Char.u) {
				throwSyntaxError(lexer);
			}

			ch = step(lexer);
			// @ts-ignore
			if (ch === Char["{"]) {
				ch = step(lexer);
				// @ts-ignore
				while (ch !== Char["}"]) {
					if (isHexChar(ch)) {
						ch = step(lexer);
					} else {
						throwSyntaxError(lexer);
					}
				}

				ch = step(lexer);
			} else {
				for (let i = 0; i < 4; i++) {
					if (isHexChar(ch)) {
						ch = step(lexer);
					} else {
						throwSyntaxError(lexer);
					}
				}
			}

			continue;
		}

		if (!isIdentifierContinue(ch)) {
			break;
		}

		ch = step(lexer);
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
export function scanRegExp(lexer: Lexer, ch: number) {
	while (true) {
		switch (ch) {
			case Char.Slash: {
				ch = step(lexer);

				while (isIdentifierContinue(ch)) {
					switch (ch) {
						case Char.g:
						case Char.i:
						case Char.m:
						case Char.s:
						case Char.u:
						case Char.y: {
							ch = step(lexer);
							break;
						}
						default:
							throw new SyntaxError("Unexpected token in RegExp");
					}
				}
				return;
			}
			default:
				ch = step(lexer);
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

function skipWhitespace(lexer: Lexer, ch: number) {
	while (isWhitespace(lexer.codePoint)) {
		switch (lexer.codePoint) {
			case Char["\r"]:
			case Char.NewLine:
			case Char["\u2028"]:
			case Char["\u2029"]:
				ch = step(lexer);
				lexer.hasNewLineBefore = true;
		}
		ch = step(lexer);
		continue;
	}
	return ch;
}

function scanStringLiteral(lexer: Lexer) {
	const quote = lexer.codePoint;
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
		switch (lexer.codePoint as number) {
			case Char.Backtick:
				hasEscape = true;
				step(lexer);

				// Handle Windows CRLF
				// if ((lexer.codePoint as number) === CodePoint['\r'] && !lexer.json.parse) {
				if ((lexer.codePoint as number) === Char["\r"]) {
					step(lexer);
					if ((lexer.codePoint as number) == Char.NewLine) {
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
					if ((lexer.codePoint as number) === Char["{"]) {
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
}

export function nextToken(lexer: Lexer) {
	let ch = skipWhitespace(lexer, lexer.codePoint);

	const { source } = lexer;

	lexer.hasNewLineBefore = lexer.end === 0;

	lexer.start = lexer.end;
	lexer.token = Token.Unknown;

	if (lexer.i > source.length) {
		return Token.EndOfFile;
	}

	ch = source.charCodeAt(lexer.i);
	if (ch > 127) {
		return scanIdentifier(lexer, ch);
	}

	const token = char2Token[ch];

	switch (token) {
		// `a`...`z`,
		case Token.IdentifierOrKeyword:
			return scanMaybeIdentifier(lexer, ch);
		// `A`...`Z` or `_var` or `$var`
		case Token.Identifier:
			return scanIdentifier(lexer, ch);
		case Token.NumericLiteral:
			return parseNumericLiteralOrDot(lexer, ch);
		case Token.StringLiteral:
			return scanStringLiteral(lexer);

		// `=`, `==`, `===`, `=>`
		case Token.Equals:
			ch = source.charCodeAt(++lexer.i);

			if (ch === Char.Equal) {
				ch = source.charCodeAt(++lexer.i);

				if (ch === Char.Equal) {
					ch = source.charCodeAt(++lexer.i);
					lexer.token = Token["==="];
					break;
				}
				lexer.token = Token["=="];
				break;
			}

			lexer.token = Token.Equals;
			break;

		// `+`. `++`, `+=`
		case Token.Plus:
			ch = source.charCodeAt(++lexer.i);

			if (ch === Char.Plus) {
				ch = source.charCodeAt(++lexer.i);
				lexer.token = Token["++"];
				break;
			} else if (ch === Char.Equal) {
				ch = source.charCodeAt(++lexer.i);
				lexer.token = Token["+="];
				break;
			}

			lexer.token = Token.Plus;
			break;

		// '<' or '<<' or '<=' or '<<='
		case Token["<"]:
			ch = source.charCodeAt(++lexer.i);

			if (ch === Char.LessThan) {
				ch = source.charCodeAt(++lexer.i);

				if (ch === Char.Equal) {
					ch = source.charCodeAt(++lexer.i);
					break;
				}
				lexer.token = Token["<<"];
				break;
			} else if (lexer.codePoint === Char.Equal) {
				lexer.token = Token["<="];
				break;
			}

			lexer.token = Token["<"];
			break;

		// '!' or '!=' or '!=='
		case Token["!"]:
			ch = source.charCodeAt(++lexer.i);

			// != or !==
			if (ch === Char.Equal) {
				ch = source.charCodeAt(++lexer.i);

				if (ch === Char.Equal) {
					ch = source.charCodeAt(++lexer.i);
					lexer.token = Token["!=="];
					break;
				} else {
					lexer.token = Token["!="];
					break;
				}
			} else {
				lexer.token = Token["!"];
				break;
			}

		// '*' or '*=' or '**' or '**='
		case Token["*"]:
			ch = source.charCodeAt(++lexer.i);
			switch (ch) {
				case Char.Equal:
					ch = source.charCodeAt(++lexer.i);
					lexer.token = Token["*="];
					break;

				case Char.Asteriks:
					ch = source.charCodeAt(++lexer.i);
					if (ch === Char.Equal) {
						ch = source.charCodeAt(++lexer.i);
						lexer.token = Token["**="];
					} else {
						lexer.token = Token["**"];
					}
					break;
				default:
					lexer.token = Token["*"];
			}

			break;

		case Token.Minus:
			// '-' or '-=' or '--' or '-->'
			ch = source.charCodeAt(++lexer.i);

			switch (lexer.codePoint as number) {
				case Char.Equal:
					lexer.i++;
					lexer.token = Token["-="];
					break;
				case Char.Minus:
					ch = source.charCodeAt(++lexer.i);

					// Handle legacy HTML-style comments
					if (ch === Char.GreaterThan && lexer.hasNewLineBefore) {
						ch = source.charCodeAt(++lexer.i);
						// lexer.log.AddRangeWarning(&lexer.source, lexer.Range(),
						// 	"Treating \"-->\" as the start of a legacy HTML single-line comment")
						singleLineHTMLCloseComment: while (true) {
							switch (ch) {
								case Char["\r"]:
								case Char.NewLine:
								case Char["\u2028"]:
								case Char["\u2029"]:
									break singleLineHTMLCloseComment;

								case -1: // This indicates the end of the file
									break singleLineHTMLCloseComment;
							}
							ch = source.charCodeAt(++lexer.i);
						}
						break;
					}

					lexer.token = Token["--"];
					break;
				default:
					lexer.token = Token.Minus;
			}
			break;

		// '/' or '/=' or '//' or '/* ... */'
		case Token["/"]:
			ch = source.charCodeAt(++lexer.i);
			switch (ch) {
				case Char.Equal: {
					ch = source.charCodeAt(++lexer.i);
					lexer.token = Token["/="];
					break;
				}
				case Char.Slash: {
					singleLineComment: while (true) {
						ch = source.charCodeAt(++lexer.i);
						switch (ch) {
							case Char["\r"]:
							case Char.NewLine:
							case Char["\u2028"]:
							case Char["\u2029"]:
							case Char.EndOfFile:
								break singleLineComment;
						}
					}
					scanCommentText(lexer);
					break;
				}
				case Char.Asteriks: {
					step(lexer);
					multiLineComment: while (true) {
						switch (lexer.codePoint as number) {
							case Char.Asteriks: {
								step(lexer);
								if (lexer.codePoint === Char.Slash) {
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
					break;
				}
				default:
					lexer.token = Token["/"];
			}
			break;

		case Token.OpenParen:
		case Token.OpenBracket:
		case Token.OpenBrace:
		case Token.CloseParen:
		case Token.CloseBracket:
		case Token.CloseBrace:
		case Token.Comma:
		case Token.Colon:
		case Token.SemiColon:
		case Token.At:
		case Token.Tilde:
			step(lexer);
			lexer.token = token;
			break;

		// "#!/usr/bin/env node"
		case Token.Hashbang:
			if (lexer.i === 0) {
				ch = step(lexer);
				if (ch === Char.Bang) {
					hashbang: while (true) {
						ch = step(lexer);
						switch (ch) {
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
					lexer.token = Token.Hashbang;
				}
			} else {
				// TOOD: Private fields
			}
			break;

		case Char.QuestionMark:
			// '?' or '?.' or '??' or '??='
			ch = step(lexer);
			switch (lexer.codePoint as number) {
				case Char.QuestionMark:
					step(lexer);
					switch (lexer.codePoint as number) {
						case Char.Equal:
							step(lexer);
							lexer.token = Token["??="];
							break;
						default:
							lexer.token = Token["??"];
					}
					break;
				case Char.Dot:
					lexer.token = Token.Question;
					let current = lexer.i;
					let contents = lexer.source;

					// Lookahead to disambiguate with 'a?.1:b'
					if (current < contents.length) {
						let c = contents.charCodeAt(current)!;
						if (c < Char.n0 || c > Char.n9) {
							step(lexer);
							lexer.token = Token.QuestionDot;
						}
					}
					break;
				default:
					lexer.token = Token.Question;
			}
			break;

		case Char.Percent:
			// '%' or '%='
			step(lexer);
			switch (lexer.codePoint as number) {
				case Char.Equal:
					step(lexer);
					lexer.token = Token.PercentEquals;
					break;
				default:
					lexer.token = Token.Percent;
			}
			break;

		case Char.Ampersand:
			// '&' or '&=' or '&&' or '&&='
			step(lexer);
			switch (lexer.codePoint as number) {
				case Char.Equal:
					step(lexer);
					lexer.token = Token["&="];
					break;
				case Char.Ampersand:
					step(lexer);
					switch (lexer.codePoint as number) {
						case Char.Equal:
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

		case Char.Pipe:
			// '|' or '|=' or '||' or '||='
			step(lexer);
			switch (lexer.codePoint as number) {
				case Char.Equal:
					step(lexer);
					lexer.token = Token["|="];
					break;
				case Char.Pipe:
					step(lexer);
					switch (lexer.codePoint as number) {
						case Char.Equal:
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

		case Char.Circonflex:
			// '^' or '^='
			step(lexer);
			switch (lexer.codePoint as number) {
				case Char.Equal:
					step(lexer);
					lexer.token = Token["^="];
					break;
				default:
					lexer.token = Token.Caret;
			}
			break;
		default:
			console.log("nono", String.fromCharCode(ch), ch);
	}
}
