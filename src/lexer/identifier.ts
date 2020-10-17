import { char2Flag, CharFlags } from "../lexer-ascii";
import { Char } from "../lexer_helpers";
import { TokenFlags } from "../tokens";
import { Lexer2 } from "./index";

export const keywords = {
	instanceof: TokenFlags.Instanceof,
	continue: TokenFlags.Continue,
	debugger: TokenFlags.Debugger,
	function: TokenFlags.Function,
	default: TokenFlags.Default,
	extends: TokenFlags.Extends,
	finally: TokenFlags.Finally,
	delete: TokenFlags.Delete,
	export: TokenFlags.Export,
	import: TokenFlags.Import,
	return: TokenFlags.Return,
	switch: TokenFlags.Switch,
	typeof: TokenFlags.Typeof,
	catch: TokenFlags.Catch,
	class: TokenFlags.Class,
	const: TokenFlags.Const,
	false: TokenFlags.False,
	super: TokenFlags.Super,
	throw: TokenFlags.Throw,
	while: TokenFlags.While,
	break: TokenFlags.Break,
	else: TokenFlags.Else,
	enum: TokenFlags.Enum,
	null: TokenFlags.Null,
	this: TokenFlags.This,
	true: TokenFlags.True,
	void: TokenFlags.Void,
	with: TokenFlags.With,
	for: TokenFlags.For,
	new: TokenFlags.New,
	try: TokenFlags.Try,
	var: TokenFlags.Var,
	do: TokenFlags.Do,
	if: TokenFlags.If,
	in: TokenFlags.In,
};

export function scanIdentifier(lexer: Lexer2, ch: number) {
	while (char2Flag[ch] & CharFlags.IdPart) {
		ch = lexer.source.charCodeAt(++lexer.i);
	}

	// Must be an identifier if true
	if (ch > Char.Z) {
		// TODO: Unicode
		throw new Error("TODO: unicode");
	}
	return TokenFlags.Identifier;
}

export function scanIdentifierOrKeyword(lexer: Lexer2, ch: number) {
	scanIdentifier(lexer, ch);

	// Keywords have a minimum length of
	const text = lexer.source.slice(lexer.start, lexer.i);
	if (text.length >= 2 && text.length <= 10) {
		if (text in keywords) return (keywords as any)[text];
	}

	return TokenFlags.Identifier;
}
