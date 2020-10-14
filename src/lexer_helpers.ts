import { Lexer } from "./lexer";

export const enum IdenitfierKind {
	NormalIdentifier,
	PrivateIdentifier,
}

export const enum Char {
	"#" = 35,
	"\r" = 13,
	NewLine = 10,
	"\u2028" = 8232,
	"\u2029" = 8233,
	Tab = 9,
	Space = 32,
	"(" = 40,
	")" = 41,
	"[" = 91,
	"]" = 93,
	"{" = 123,
	"}" = 125,
	Comma = 44,
	Colon = 58,
	SemiColon = 59,
	At = 64,
	Tilde = 126,
	QuestionMark = 63,
	Percent = 37,
	Ampersand = 38,
	Equal = 61,
	Pipe = 124,
	Circonflex = 94,
	Plus = 43,
	Minus = 45,
	Asteriks = 42,
	Slash = 47,
	LessThan = 60,
	GreaterThan = 62,
	Bang = 33,
	NoBreakSpace = 106,
	FormFeed = 12,
	LineTab = 11,
	BackSlash = 92,

	DoubleQuote = 34,
	Quote = 39,
	Backtick = 96,

	// Unicode "Space_Separator" code points
	OghamSpaceMark = 5760,
	EnQuad = 8192,
	EmQuad = 8193,
	EnSpace = 8194,
	EmSpace = 8195,

	DoubleBackSlash = 9290,

	Dot = 46,

	n0 = 48,
	n1 = 49,
	n2 = 50,
	n3 = 51,
	n4 = 52,
	n5 = 53,
	n6 = 54,
	n7 = 55,
	n8 = 56,
	n9 = 57,

	_ = 95,
	$ = 36,
	A = 65,
	B = 66,
	C = 67,
	D = 68,
	E = 69,
	F = 70,
	G = 71,
	H = 72,
	I = 73,
	J = 74,
	K = 75,
	L = 76,
	M = 77,
	N = 78,
	O = 79,
	P = 80,
	Q = 81,
	R = 82,
	S = 83,
	T = 84,
	U = 85,
	V = 86,
	W = 87,
	X = 88,
	Y = 89,
	Z = 90,

	a = 97,
	b = 98,
	c = 99,
	d = 100,
	e = 101,
	f = 102,
	g = 103,
	h = 104,
	i = 105,
	j = 106,
	k = 107,
	l = 108,
	m = 109,
	n = 110,
	o = 111,
	p = 112,
	q = 113,
	r = 114,
	s = 115,
	t = 116,
	u = 117,
	v = 118,
	w = 119,
	x = 120,
	y = 121,
	z = 122,

	EndOfFile = -1,
}

export const strictModeReservedWords = new Set<string>([
	"implements",
	"interface",
	"let",
	"package",
	"private",
	"protected",
	"public",
	"static",
	"yield",
]);

export function isKeyword(text: string) {
	switch (text) {
		case "break":
		case "case":
		case "catch":
		case "class":
		case "const":
		case "continue":
		case "debugger":
		case "default":
		case "delete":
		case "do":
		case "else":
		case "enum":
		case "export":
		case "extends":
		case "false":
		case "finally":
		case "for":
		case "function":
		case "if":
		case "import":
		case "in":
		case "instanceof":
		case "new":
		case "null":
		case "return":
		case "super":
		case "switch":
		case "this":
		case "throw":
		case "true":
		case "try":
		case "typeof":
		case "var":
		case "void":
		case "while":
		case "with":
			return true;
		default:
			return false;
	}
}

export function isWhitespace(codePoint: number) {
	console.log("isWhitespace", codePoint);
	switch (codePoint) {
		case Char.Tab:
		case Char.LineTab:
		case Char.FormFeed:
		case Char.Space:
		case Char.NoBreakSpace:

		// Unicode "Space_Separator" code points
		case Char.OghamSpaceMark:
		case Char.EnQuad:
		case Char.EmQuad:
		case Char.EnSpace:
		case Char.EmSpace:
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

export function formatLexerPosition(lexer: Lexer) {
	// TODO: This is an approximation, whitespace is not respected
	const text = lexer.source
		.slice(
			Math.max(0, lexer.start - 10),
			Math.min(lexer.source.length, lexer.end + 10)
		)
		.replace(/\n/, "↵");
	return "\n" + text + "\n" + " ".repeat(10) + "^";
}

export function isHexChar(codePoint: number) {
	switch (codePoint) {
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
		case Char.a:
		case Char.b:
		case Char.c:
		case Char.d:
		case Char.e:
		case Char.f:
		case Char.A:
		case Char.B:
		case Char.C:
		case Char.D:
		case Char.E:
		case Char.F:
			return true;
		default:
			return false;
	}
}

export function isIdentifierChar(codePoint: number) {
	switch (codePoint) {
		case Char._:
		case Char.$:
		case Char.a:
		case Char.b:
		case Char.c:
		case Char.d:
		case Char.e:
		case Char.f:
		case Char.g:
		case Char.h:
		case Char.i:
		case Char.j:
		case Char.k:
		case Char.l:
		case Char.m:
		case Char.n:
		case Char.o:
		case Char.p:
		case Char.q:
		case Char.r:
		case Char.s:
		case Char.t:
		case Char.u:
		case Char.v:
		case Char.w:
		case Char.x:
		case Char.y:
		case Char.z:
		case Char.A:
		case Char.B:
		case Char.C:
		case Char.D:
		case Char.E:
		case Char.F:
		case Char.G:
		case Char.H:
		case Char.I:
		case Char.J:
		case Char.K:
		case Char.L:
		case Char.M:
		case Char.N:
		case Char.O:
		case Char.P:
		case Char.Q:
		case Char.R:
		case Char.S:
		case Char.T:
		case Char.U:
		case Char.V:
		case Char.W:
		case Char.X:
		case Char.Y:
		case Char.Z:
			return true;
		default:
			return false;
	}
}

export function isIdentifier(text: string): boolean {
	if (text.length === 0) {
		return false;
	}
	for (let i = 0; i < text.length; i++) {
		const codePoint = text.charCodeAt(i)!;
		if (i == 0) {
			if (!isIdentifierStart(codePoint)) {
				return false;
			}
		} else {
			if (!isIdentifierContinue(codePoint)) {
				return false;
			}
		}
	}
	return true;
}

export function isIdentifierStart(codePoint: number) {
	if (isIdentifierChar(codePoint)) return true;

	// All ASCII identifier start code points are listed above
	if (codePoint < 0x7f) {
		return false;
	}

	// FIXME unicode
	return true;
}

export function isIdentifierContinue(codePoint: number) {
	if (isIdentifierChar(codePoint)) return true;
	switch (codePoint) {
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

	if (codePoint === Char.EndOfFile) return false;
	// FIXME
	// return unicode.Is(idContinue, codePoint);
	return true;
}
