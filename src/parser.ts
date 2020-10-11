import * as t from "estree";
import {
	expectOrInsertSemicolon,
	expectToken,
	getRaw,
	isContextualKeyword,
	Lexer,
	newLexer,
	next,
} from "./lexer";
import { Token } from "./tokens";
import * as tt from "./ast";

// TODO: Sourcemap
// TODO: Sourcelocation
// TODO: Error handling

export interface Parser {
	lexer: Lexer;
}

export function newParser(lexer: Lexer): Parser {
	return {
		lexer,
	};
}

export function parse(source: string): tt.Program {
	const lexer = newLexer(source);
	const parser = newParser(lexer);

	// Consume leading hashbang
	let hashbang: string | null = null;
	if (lexer.token === Token.Hashbang) {
		hashbang = lexer.identifier;
		next(lexer);
	}

	const statements = parseStatementsUpTo(parser, Token.EOF);
	const program = tt.program("module", statements as any);
	program.hashbang = hashbang;
	return program;
}

let ii = 0;
function parseStatementsUpTo(p: Parser, end: Token) {
	const statements: tt.Statement[] = [];

	while (true) {
		if (ii++ > 50) throw new Error("infinite");
		if (p.lexer.token === end) {
			break;
		} else if (p.lexer.token === Token.SemiColon) {
			next(p.lexer);
			continue;
		}

		const statement = parseStatement(p);
		statements.push(statement);
	}

	return statements;
}

function parseStatement(p: Parser): tt.Statement {
	switch (p.lexer.token) {
		case Token.Export: {
			next(p.lexer);

			break;
		}
		case Token.Const:
		case Token.Let:
		case Token.Var: {
			const kind: tt.VariableDeclaration["kind"] =
				p.lexer.token === Token.Const
					? "const"
					: p.lexer.token === Token.Let
					? "let"
					: "var";
			next(p.lexer);

			const declarations = parseDeclarations(p);
			return tt.variableDeclaration(kind, declarations);
		}
		case Token.SemiColon:
			next(p.lexer);
			return tt.emptyStatement("");
		case Token.For: {
			next(p.lexer);

			// TODO: "for await (let x of y) {}"
			expectToken(p.lexer, Token.OpenParen);

			// TODO: Disallow in expressions
			let init: tt.Expression | tt.VariableDeclaration | null = null;
			let test: tt.Expression | null = null;
			let update: tt.Expression | null = null;
			switch (p.lexer.token as number) {
				case Token.Var: {
					next(p.lexer);
					const declarations = parseDeclarations(p);
					if (declarations.length > 0) {
						init = tt.variableDeclaration("var", declarations);
					}
					break;
				}
				case Token.SemiColon:
					break;
				default:
					init = parseExpressionOrLetStatement(p);
			}

			if (isContextualKeyword(p.lexer, "of")) {
				// TODO: This is whacky
				if (!init || Array.isArray(init)) {
					throw new Error(`Missing left expression in for-of loop`);
				}
				// TODO: Forbid initializer "of"
				// TODO: Mark syntax
				next(p.lexer);
				const value = parseExpression(p);
				expectToken(p.lexer, Token.CloseParen);

				const body = parseStatement(p);
				return tt.forOfStatement(init, value, body, false);
			}
			// TODO: Detect for-in loops

			// Normal for loop
			expectToken(p.lexer, Token.SemiColon);

			if ((p.lexer.token as number) !== Token.SemiColon) {
				test = parseExpression(p);
			}

			expectToken(p.lexer, Token.SemiColon);

			if ((p.lexer.token as number) !== Token.CloseParen) {
				update = parseExpression(p);
			}

			expectToken(p.lexer, Token.CloseParen);

			const body = parseStatement(p);
			return tt.forStatement(body, init, update, test);
		}
		default:
			const out = parseExpressionOrLetStatement(p);
			if (out !== null) {
				expectOrInsertSemicolon(p.lexer);
				// FIXME: Expression vs Statement mismatch
				return out as any;
			}
			expectOrInsertSemicolon(p.lexer);
	}

	console.log(p.lexer);
	console.log(p.lexer.source.slice(p.lexer.start));
	throw new Error(`Could not parse token: ${p.lexer.token}`);
}

function parseExpressionOrLetStatement(p: Parser) {
	const raw = getRaw(p.lexer);

	if (p.lexer.token !== Token.Identifier || raw !== "let") {
		return parseExpression(p);
	}

	next(p.lexer);

	switch (p.lexer.token as number) {
		case Token.Identifier:
		case Token.OpenBracket:
		case Token.OpenBrace: {
			// TODO: Check lexical declarations
			const declarations = parseDeclarations(p);
			return null;
		}
	}

	return null;
}

function parseDeclarations(p: Parser): tt.VariableDeclarator[] {
	const declarations: tt.VariableDeclarator[] = [];

	while (true) {
		if (p.lexer.token === Token.EOF) {
			break;
		}
		if (ii++ > 50) throw new Error("infinite");
		// TODO: Forbid "let let" and "const let" but not "var let"
		const binding = parseBinding(p);

		let value: tt.Expression | null = null;

		if (p.lexer.token === Token.Equals) {
			next(p.lexer);
			value = parseExpression(p);
		}

		if (!value) {
			console.log(value, p.lexer);
			throw new Error("fail a");
		}

		const decl = tt.variableDeclarator(binding, value);
		declarations.push(decl);
		if (p.lexer.token !== Token.Comma) {
			break;
		}

		next(p.lexer);
	}

	return declarations;
}

function parseExpression(p: Parser): tt.Expression {
	const expression = parsePrefix(p);

	return parseSuffix(p, expression);
}

function parsePrefix(p: Parser): tt.Expression {
	switch (p.lexer.token) {
		case Token.False:
			next(p.lexer);
			return tt.literal(false);
		case Token.True:
			next(p.lexer);
			return tt.literal(true);
		case Token.Null:
			next(p.lexer);
			return tt.literal(null);
		case Token.StringLiteral: {
			const value = p.lexer.string;
			next(p.lexer);
			return tt.literal(value);
		}
		case Token.NumericLiteral: {
			const value = p.lexer.number;
			next(p.lexer);
			return tt.literal(value);
		}
		case Token.Identifier: {
			const name = p.lexer.identifier;
			const identifier = tt.identifier(name);

			next(p.lexer);
			return identifier;
		}
	}
	console.log(p.lexer);
	throw new Error("fail #ac");
}

function parseSuffix(p: Parser, left: tt.Expression): tt.Expression {
	//
	return left;
}

function parseBinding(p: Parser): tt.Identifier | tt.ObjectPattern {
	//

	switch (p.lexer.token) {
		case Token.Identifier: {
			const name = p.lexer.identifier;
			next(p.lexer);
			return tt.identifier(name);
		}

		case Token.OpenBracket: {
			const properties: tt.ObjectPattern["properties"] = [];

			// @ts-ignore
			while (p.lexer.token !== Token.CloseBracket) {
				// @ts-ignore
				if (p.lexer.token === Token.Comma) {
					continue;
				}

				const binding = parseBinding(p);
				if (binding.type === "ObjectPattern") {
					throw new Error("Invalid token");
				}

				const property = tt.property(binding, binding);
				properties.push(property);
				next(p.lexer);
			}

			return tt.objectPattern(properties);
		}
		case Token.OpenBrace: {
			next(p.lexer);

			const elements: tt.ArrayPattern["elements"] = [];
			let hasSpread = false;

			// @ts-ignore
			while (p.lexer.token !== Token.CloseBrace) {
				// @ts-ignore
				if (p.lexer.token === Token.Comma) {
					if (hasSpread) {
						// TODO: Better error message
						throw new Error("invalid");
					}
					continue;
				}
				const element = parsePropertyBinding(p);
				elements.push(element);

				//
			}
			break;
		}
	}

	// FIXME: Proper error messages
	throw new Error("Fail 2");
}

export function parsePropertyBinding(p: Parser) {
	//

	switch (p.lexer.token) {
		case Token.DotDotDot:
			next(p.lexer);
			const value = tt.identifier(p.lexer.identifier);
			// TODO: Expect identifier
			return tt.restElement(value);
		case Token.NumericLiteral: {
			break;
		}
	}

	throw new Error("fail 3");
}
