import { CodePoint } from "./codePoints";
import { Token } from "./tokens";
import * as logger from "./logger"

export interface Lexer {
	i: number;
	codePoint: number;
	source: string;
	hasNewLineBefore: boolean;
  token: number;
  identifier: string;
  number: any;
  start: number;
  end: number;
  isLogDisabled: boolean
  logger: logger.Logger
}

export function createLexer(source: string): Lexer {
	const lexer = {
		i: 0,
		codePoint: -1,
		source,
		hasNewLineBefore: false,
    token: 0,
    number: undefined,
    identifier: undefined,
    start: -1,
    end: -1,
    isLogDisabled: false,
    logger: {
      logs: []
    }
	};

	return lexer;
}

function step(lexer: Lexer) {
	lexer.codePoint = lexer.source.charCodeAt(lexer.i);
	lexer.i++;
}

function addError(lexer: Lexer, loc: number, text: string) {
	if (!lexer.isLogDisabled) {
		logger.addError(lexer.logger, lexer.source, loc, text);
	}
}

function throwSyntaxError(lexer: Lexer) {
	const loc = lexer.end;
	let message = "Unexpected end of file";
	if (lexer.end < lexer.source.length) {
		let c, _ = utf8.DecodeRuneInString(lexer.source[lexer.end:])
		if (c < 0x20) {
			message = `Syntax error \"\\x${c}02X\"`
		} else if (c >= 0x80) {
			message = `Syntax error \"\\u{${c}x}\"`
		} else if (c != '"') {
			message = `Syntax error \"${c}c\"`
		} else {
			message = "Syntax error '\"'"
		}
	}
  addError(lexer, loc, message);
  throw new Error(message);
	// panic(LexerPanic{})
}

function isWhitespace(codePoint: number) {
	switch (codePoint) {
		case CodePoint.Tab:
		case CodePoint.LineTab:
		case CodePoint.FormFeed:
		case CodePoint.Space:
		case CodePoint.NoBreakSpace:

		// Unicode "Space_Separator" code points
		case CodePoint.OghamSpaceMark:
		case CodePoint.EnQuad:
		case CodePoint.EmQuad:
		case CodePoint.EnSpace:
		case CodePoint.EmSpace:
			// "\u2004", // three-per-em space
			// "\u2005", // four-per-em space
			// "\u2006", // six-per-em space
			// "\u2007", // figure space
			// "\u2008", // punctuation space
			// "\u2009", // thin space
			// "\u200A", // hair space
			// "\u202F", // narrow no-break space
			// "\u205F", // medium mathematical space
			// "\u3000", // ideographic space
			// "\uFEFF"): // zero width non-breaking space
			return true;
		default:
			return false;
	}
}

function isIdentifierStart(codePoint) {
	switch (codePoint) {
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
			return true;
	}

	// All ASCII identifier start code points are listed above
	if (codePoint < 0x7f) {
		return false;
	}

	// FIXME
	return true;
}

function IsIdentifierContinue(codePoint: number) {
	switch (codePoint) {
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
			return true;
	}

	// All ASCII identifier start code points are listed above
	if (codePoint < 0x7f) {
		return false;
	}

	// ZWNJ and ZWJ are allowed in identifiers
	if (codePoint == 0x200c || codePoint == 0x200d) {
		return true;
	}

	return unicode.Is(idContinue, codePoint);
}

function parseNumericLiteralOrDot(lexer: Lexer) {
  // Number or dot
  const first = lexer.codePoint
  step(lexer);


	// Dot without a digit after it
	if (first === CodePoint.Dot && (lexer.codePoint < CodePoint.n0 || lexer.codePoint > CodePoint.n9)) {
		// "..."
		if (lexer.codePoint === CodePoint.Dot &&
			lexer.i < (lexer.source.length) &&
			lexer.source[lexer.i] == '.') {
			step(lexer);
			step(lexer)
			lexer.token = Token.DotDotDot
			return
		}

		// "."
		lexer.token = Token.Dot
		return
	}

	let underscoreCount = 0
	let lastUnderscoreEnd = 0
  let hasDotOrExponent = first === CodePoint.Dot;
  let isLegacyOctalLiteral = false
	let base = 0.0

	// Assume this is a number, but potentially change to a bigint later
	lexer.token = Token.NumericLiteral

	// Check for binary, octal, or hexadecimal literal
	if (first === CodePoint.n0) {
		switch (lexer.codePoint) {
      case CodePoint.b:
      case CodePoint.B:
      base = 2
      break

      case CodePoint.o:
        case CodePoint.O:
      base = 8
      break;

      case CodePoint.x:
        case CodePoint.X:
      base = 16
      break;

      case CodePoint.n0:
      case CodePoint.n1:
      case CodePoint.n2:
      case CodePoint.n3:
      case CodePoint.n4:
      case CodePoint.n5:
      case CodePoint.n6:
      case CodePoint.n7:
			base = 8
			isLegacyOctalLiteral = true
		}
	}

	if (base !== 0) {
		// Integer literal
		let isFirst = true
		let isInvalidLegacyOctalLiteral = false
		lexer.number = 0
		if (!isLegacyOctalLiteral) {
			step(lexer)
		}

	integerLiteral:
		while(true) {
			switch (lexer.codePoint) {
			case CodePoint._:
				// Cannot have multiple underscores in a row
				if (lastUnderscoreEnd > 0 && lexer.end === lastUnderscoreEnd+1) {
					throwSyntaxError(lexer);
				}

				// The first digit must exist
				if (isFirst) {
					throwSyntaxError(lexer);
				}

				lastUnderscoreEnd = lexer.end
				underscoreCount++
break;
      case CodePoint.n0:
        case CodePoint.n1:
				lexer.number = lexer.number*base + (lexer.codePoint-CodePoint.n0)
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
				lexer.number = lexer.number*base + (lexer.codePoint-CodePoint.n0)
break;
case CodePoint.n8:
  case CodePoint.n9:
				if (isLegacyOctalLiteral) {
					isInvalidLegacyOctalLiteral = true
				} else if (base < 10) {
					throwSyntaxError(lexer);
				}
				lexer.number = lexer.number*base + (lexer.codePoint-CodePoint.n0)

      break;
      case CodePoint.A:
      case CodePoint.B:
      case CodePoint.C:
      case CodePoint.D:
      case CodePoint.E:
      case CodePoint.F:
				if (base !== 16 ){
					throwSyntaxError(lexer);
				}
				lexer.number = lexer.number*base + (lexer.codePoint+10- CodePoint.A)
break;
case CodePoint.a:
case CodePoint.b:
case CodePoint.c:
case CodePoint.d:
case CodePoint.e:
case CodePoint.f:
				if (base != 16) {
					throwSyntaxError(lexer);
				}
				lexer.number = lexer.number*base + (lexer.codePoint+10-CodePoint.a)
break;
			default:
				// The first digit must exist
				if (isFirst) {
					throwSyntaxError(lexer);
				}

				break integerLiteral
			}

      step(lexer)
			isFirst = false
		}

		let isBigIntegerLiteral = lexer.codePoint === CodePoint.n && !hasDotOrExponent

		// Slow path: do we need to re-scan the input as text?
		if (isBigIntegerLiteral || isInvalidLegacyOctalLiteral) {
			let text = lexer.Raw()

			// Can't use a leading zero for bigint literals
			if (isBigIntegerLiteral && isLegacyOctalLiteral) {
				throwSyntaxError(lexer);
			}

			// Filter out underscores
			if (underscoreCount > 0) {
				let bytes = make([]byte, 0, (text.length)-underscoreCount)
				for (let i = 0; i < text.length; i++) {
					let c = text[i]
					if (c != '_') {
						bytes = append(bytes, c)
					}
				}
				text = string(bytes)
			}

			// Store bigints as text to avoid precision loss
			if (isBigIntegerLiteral) {
				lexer.identifier = text
			} else if (isInvalidLegacyOctalLiteral) {
				// Legacy octal literals may turn out to be a base 10 literal after all
				let value, _ = parseFloat(text)
				lexer.number = value
			}
		}
	} else {
		// Floating-point literal

		// Initial digits
		while (true) {
			if (lexer.codePoint < CodePoint.n0 || lexer.codePoint > CodePoint.n9) {
				if (lexer.codePoint !== CodePoint._) {
					break
				}

				// Cannot have multiple underscores in a row
				if (lastUnderscoreEnd > 0 && lexer.end == lastUnderscoreEnd+1) {
					throwSyntaxError(lexer);
				}

				lastUnderscoreEnd = lexer.end
				underscoreCount++
      }
      step(lexer)
		}

		// Fractional digits
		if (first !== CodePoint.Dot && lexer.codePoint === CodePoint.Dot) {
			// An underscore must not come last
			if (lastUnderscoreEnd > 0 && lexer.end == lastUnderscoreEnd+1) {
				lexer.end--
				throwSyntaxError(lexer);
			}

			hasDotOrExponent = true
			step(lexer)
			while(true) {
				if (lexer.codePoint < CodePoint.n0 || lexer.codePoint > CodePoint.n9) {
					if ((lexer.codePoint as number) !== CodePoint._) {
						break
					}

					// Cannot have multiple underscores in a row
					if (lastUnderscoreEnd > 0 && lexer.end == lastUnderscoreEnd+1) {
						throwSyntaxError(lexer);
					}

					lastUnderscoreEnd = lexer.end
					underscoreCount++
        }
        step(lexer)
			}
		}

		// Exponent
		if (lexer.codePoint === CodePoint.e || lexer.codePoint ==  CodePoint.E) {
			// An underscore must not come last
			if (lastUnderscoreEnd > 0 && lexer.end == lastUnderscoreEnd+1) {
				lexer.end--
				throwSyntaxError(lexer);
			}

      hasDotOrExponent = true
      step(lexer);
			if ((lexer.codePoint as number) === CodePoint.Plus || (lexer.codePoint as number) === CodePoint.Minus) {
        step(lexer)
			}
			if (lexer.codePoint < CodePoint.n0 || lexer.codePoint > CodePoint.n9) {
				throwSyntaxError(lexer);
			}
			while(true) {
				if (lexer.codePoint < CodePoint.n0 || lexer.codePoint > CodePoint.n9) {
					if ((lexer.codePoint as number) !== CodePoint._) {
						break
					}

					// Cannot have multiple underscores in a row
					if (lastUnderscoreEnd > 0 && lexer.end == lastUnderscoreEnd+1) {
						throwSyntaxError(lexer);
					}

					lastUnderscoreEnd = lexer.end
					underscoreCount++
        }
        step(lexer)
			}
		}

		// Take a slice of the text to parse
		let text = lexer.Raw()

		// Filter out underscores
		if (underscoreCount > 0) {
			let bytes = make([]byte, 0, text.length-underscoreCount)
			for (let i = 0; i < text.length; i++) {
				const c = text[i]
				if (c != '_') {
					bytes = append(bytes, c)
				}
			}
			text = string(bytes)
		}

		if (lexer.codePoint === CodePoint.n && !hasDotOrExponent) {
			// The only bigint literal that can start with 0 is "0n"
			if (text.length > 1 && first === CodePoint.n0) {
				throwSyntaxError(lexer);
			}

			// Store bigints as text to avoid precision loss
			lexer.identifier = text
		} else if (!hasDotOrExponent && lexer.end-lexer.start < 10) {
			// Parse a 32-bit integer (very fast path)
			let n = 0
			for (_, c = range text) {
				n = n*10 + (c-CodePoint.n0)
			}
			lexer.number = n;
		} else {
			// Parse a double-precision floating-point number
			const value, _ = parseFloat(text)
			lexer.number = value
		}
	}

	// An underscore must not come last
	if (lastUnderscoreEnd > 0 && lexer.end == lastUnderscoreEnd+1) {
		lexer.end--
		throwSyntaxError(lexer);
	}

	// Handle bigint literals after the underscore-at-end check above
	if (lexer.codePoint === CodePoint.n && !hasDotOrExponent) {
		lexer.token = Token.BigIntLiteral
		step(lexer)
	}

	// Identifiers can't occur immediately after numbers
	if (isIdentifierStart(lexer.codePoint)) {
		throwSyntaxError(lexer);
	}
}


export function next(lexer: Lexer) {
	while (true) {
		switch (lexer.codePoint) {
			case CodePoint["#"]:
				// Hashbang
				continue;

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
				// TODO
				break;

			case CodePoint.Percent:
				// TODO
				break;

			case CodePoint.Ampersand:
				// TODO
				break;

			case CodePoint.Pipe:
				step(lexer);
				// TODO
				break;

			case CodePoint.Circonflex:
				step(lexer);
				// TODO
				break;

			case CodePoint.Plus:
        
        // '+' or '+=' or '++'
        step(lexer);
			switch (lexer.codePoint as number) {
			case CodePoint.Equal:
				step(lexer)
        lexer.token = Token.PlusEquals
        break;
			case CodePoint.Plus:
				step(lexer)
        lexer.token = Token.PlusPlus
        break;
			default:
				lexer.token = Token.Plus
			}
				break;

			case CodePoint.Minus:
				step(lexer);
				// TODO
				break;

			case CodePoint.Asteriks:
					// '*' or '*=' or '**' or '**='
			step(lexer)
			switch (lexer.codePoint as number) {
			case CodePoint.Equal:
				step(lexer)
				lexer.token = Token.AsteriksEquals

			case CodePoint.Asteriks:
        step(lexer)
        if ((lexer.codePoint as number) === CodePoint.Equal) {
          step(lexer)
          lexer.token = Token.AsteriksAsteriksEquals

        } else {
          lexer.token = Token.AsteriksAsteriks
        }
        break;
			default:
				lexer.token = Token.Asteriks
			}

				break;

			case CodePoint.Slash:
				step(lexer);
				// TODO
				break;

			case CodePoint.Equal:
					// '=' or '=>' or '==' or '==='
			step(lexer)
			switch (lexer.codePoint as number) {
			case CodePoint.GreaterThan:
				step(lexer)
        lexer.token = Token.EqualsGreaterThan;
        break;
			case CodePoint.Equal:
        step(lexer)
        if (lexer.codePoint === CodePoint.Equal) {

          step(lexer)
          lexer.token = Token.EqualsEqualsEquals
        }else {

          lexer.token = Token.EqualsEquals
        }
        break;
			default:
				lexer.token = Token.Equals
			}

				break;

			case CodePoint.LessThan:
				step(lexer);
				// TODO
				break;

			case CodePoint.GreaterThan:
				step(lexer);
				// TODO
				break;

			case CodePoint.Bang:
				// '!' or '!=' or '!=='
				step(lexer);

				// != or !==
				if ((lexer.codePoint as number) === CodePoint.Equal) {
					step(lexer);
					// !==
					if ((lexer.codePoint as number) === CodePoint.Equal) {
						step(lexer);
						lexer.token = Token.TBangEqualEqual;
					} else {
						lexer.token = Token.TBangEqual;
					}
				} else {
					// !
					lexer.token = Token.Bang;
				}
				break;

			// case '\'', '"', '`':

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

				while (IsIdentifierContinue(lexer.codePoint)) {
					step(lexer);
				}

				// \\
				if (false) {
					// FIXME
				} else {
				}

				break;

			case "\\":
				// FIXME
				break;

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

					while (IsIdentifierContinue(lexer.codePoint)) {
						step(lexer);
					}

					if (lexer.codePoint == "\\") {
						// FIXME
					} else {
						lexer.token = Token.Identifier;
					}
					break;
				}

				lexer.token = Token.SyntaxError;
		}

		return;
	}
}
