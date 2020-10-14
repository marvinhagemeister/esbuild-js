import { Lexer, step, getRaw } from "../lexer";
import { Token } from "../tokens";
import { char2Flag, CharFlags } from "./tables";

export const keywords: Record<string, Token> = {
	break: Token.Break,
	case: Token.Case,
	catch: Token.Catch,
	class: Token.Class,
	const: Token.Const,
	continue: Token.Continue,
	debugger: Token.Debugger,
	default: Token.Default,
	delete: Token.Delete,
	do: Token.Do,
	else: Token.Else,
	enum: Token.Enum,
	export: Token.Export,
	extends: Token.Extends,
	false: Token.False,
	finally: Token.Finally,
	for: Token.For,
	function: Token.Function,
	if: Token.If,
	import: Token.Import,
	in: Token.In,
	instanceof: Token.Instanceof,
	new: Token.New,
	null: Token.Null,
	return: Token.Return,
	super: Token.Super,
	switch: Token.Switch,
	this: Token.This,
	throw: Token.Throw,
	true: Token.True,
	try: Token.Try,
	typeof: Token.Typeof,
	var: Token.Var,
	void: Token.Void,
	while: Token.While,
	with: Token.With,
};

export function scanIdentifier(lexer: Lexer, ch: number) {
	while (char2Flag[ch] & CharFlags.IdPart) {
		ch = step(lexer);
	}

	lexer.identifier = getRaw(lexer);
	lexer.token = Token.Identifier;
	return lexer.token;
}

export function scanMaybeIdentifier(lexer: Lexer, ch: number) {
	scanIdentifier(lexer, ch);

	if (lexer.identifier in keywords) {
		return keywords[lexer.identifier];
	}

	return Token.Identifier;
}
