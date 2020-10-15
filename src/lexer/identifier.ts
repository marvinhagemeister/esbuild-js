import { identifier } from "../ast";
import { char2Flag, CharFlags } from "../lexer-ascii";
import { Char } from "../lexer_helpers";
import { Token } from "../tokens";
import { Lexer2, getRaw } from "./core";

export const keywords = {
	instanceof: Token.Instanceof,
	continue: Token.Continue,
	debugger: Token.Debugger,
	function: Token.Function,
	default: Token.Default,
	extends: Token.Extends,
	finally: Token.Finally,
	delete: Token.Delete,
	export: Token.Export,
	import: Token.Import,
	return: Token.Return,
	switch: Token.Switch,
	typeof: Token.Typeof,
	catch: Token.Catch,
	class: Token.Class,
	const: Token.Const,
	false: Token.False,
	super: Token.Super,
	throw: Token.Throw,
	while: Token.While,
	break: Token.Break,
	else: Token.Else,
	enum: Token.Enum,
	null: Token.Null,
	this: Token.This,
	true: Token.True,
	void: Token.Void,
	with: Token.With,
	for: Token.For,
	new: Token.New,
	try: Token.Try,
	var: Token.Var,
	do: Token.Do,
	if: Token.If,
	in: Token.In,
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
	return Token.Identifier;
}

export function scanIdentifierOrKeyword(lexer: Lexer2, ch: number) {
	scanIdentifier(lexer, ch);

	// Keywords have a minimum length of
	const text = lexer.source.slice(lexer.start, lexer.i);
	if (text.length >= 2 && text.length <= 10) {
		if (text in keywords) return (keywords as any)[text];
	}

	return Token.Identifier;
}
