import { char2Flag } from "../lexer-ascii";
import { Token } from "../tokens";
import { Lexer2 } from "./core";
import { scanIdentifier, scanIdentifierOrKeyword } from "./identifier";
import { scanNumberLiteral } from "./numeric";
import { scanStringLiteral } from "./string";

export function scanSingleToken(lexer: Lexer2) {
	//

	const ch = lexer.source.charCodeAt(lexer.i);

	if (ch > 127) {
		// TODO: Unicode
		throw new Error("TODO: Unicode");
	}

	const token = char2Flag[ch];

	switch (token) {
		// a..z
		case Token.IdentifierOrKeyword:
			return scanIdentifierOrKeyword(lexer, ch);
		// A...Z or _ or $
		case Token.Identifier:
			return scanIdentifier(lexer, ch);
		// 0..9
		case Token.NumericLiteral:
			return scanNumberLiteral(lexer, ch);
		// 'string' or "string"
		case Token.StringLiteral:
			return scanStringLiteral(lexer);
	}
}
