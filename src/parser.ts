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
import { platform } from "os";

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

function parseStatementsUpTo(p: Parser, end: Token) {
	const statements: tt.Statement[] = [];

	while (true) {
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
		case Token.Function:
			next(p.lexer);
			return parseFunctionExpression(p, false);
		case Token.Const:
		case Token.Var: {
			const kind: tt.VariableDeclaration["kind"] =
				p.lexer.token === Token.Const
					? "const"
					: getRaw(p.lexer) === "let"
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
				case Token.Const:
					next(p.lexer);
					const declarations = parseDeclarations(p);
					init = tt.variableDeclaration("const", declarations);
					break;
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
				const value = parseExpression(p, tt.Precedence.Comma);
				expectToken(p.lexer, Token.CloseParen);

				const body = parseStatement(p);
				return tt.forOfStatement(init, value, body, false);
			}

			if ((p.lexer.token as number) === Token.In) {
				if (init === null) {
					throw new Error(`No left expression found in for-in loop`);
				}
				// TODO: Forbid "in" initializer
				next(p.lexer);
				const value = parseExpression(p, tt.Precedence.Lowest);
				expectToken(p.lexer, Token.CloseParen);

				const body = parseStatement(p);
				return tt.forInStatement(init, value, body);
			}

			// Normal for loop
			expectToken(p.lexer, Token.SemiColon);

			if ((p.lexer.token as number) !== Token.SemiColon) {
				test = parseExpression(p, tt.Precedence.Lowest);
			}

			expectToken(p.lexer, Token.SemiColon);

			if ((p.lexer.token as number) !== Token.CloseParen) {
				update = parseExpression(p, tt.Precedence.Lowest);
			}

			expectToken(p.lexer, Token.CloseParen);

			const body = parseStatement(p);
			return tt.forStatement(body, init, update, test);
		}
		default:
			// Parse either an async function, an async expression, or a normal expression
			if (p.lexer.token === Token.Identifier && getRaw(p.lexer) === "async") {
				next(p.lexer);
				if ((p.lexer.token as number) === Token.Function) {
					next(p.lexer);
					return parseFunctionExpression(p, true);
				}
			}

			const out = parseExpressionOrLetStatement(p);
			if (out !== null) {
				expectOrInsertSemicolon(p.lexer);
				if (out.type === "VariableDeclaration") {
					return out;
				}
				return tt.expressionStatement(out);
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
		return parseExpression(p, tt.Precedence.Lowest);
	}

	next(p.lexer);

	switch (p.lexer.token as number) {
		case Token.Identifier:
		case Token.OpenBracket:
		case Token.OpenBrace: {
			// TODO: Check lexical declarations
			const declarations = parseDeclarations(p);
			return tt.variableDeclaration("let", declarations);
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
		// TODO: Forbid "let let" and "const let" but not "var let"
		const binding = parseBinding(p);

		let value: tt.Expression | null = null;

		if (p.lexer.token === Token.Equals) {
			next(p.lexer);
			value = parseExpression(p, tt.Precedence.Comma);
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

/**
 * @param p
 * @param level Operator precedence
 */
function parseExpression(p: Parser, level: number): tt.Expression {
	const expression = parsePrefix(p, level);

	return parseSuffix(p, expression, level);
}

function parsePrefix(p: Parser, level: number): tt.Expression {
	switch (p.lexer.token) {
		case Token.OpenParen: {
			next(p.lexer);
			return parseParenExpression(p);
		}
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
		case Token.Void: {
			next(p.lexer);
			const value = parseExpression(p, tt.Precedence.Prefix);
			return tt.unaryExpression("void", value);
		}
		case Token.Typeof: {
			next(p.lexer);
			const value = parseExpression(p, tt.Precedence.Prefix);
			return tt.unaryExpression("typeof", value);
		}
		case Token.Delete: {
			next(p.lexer);
			const value = parseExpression(p, tt.Precedence.Prefix);
			return tt.unaryExpression("delete", value);
		}
		case Token.Identifier: {
			const name = p.lexer.identifier;
			const raw = getRaw(p.lexer);
			next(p.lexer);

			switch (name) {
				case "async": {
					if (raw === "async") {
						return parseAsyncPrefixExpression(p);
					}

					break;
					// TODO: await
					// TODO: yield
				}
			}

			const identifier = tt.identifier(name);
			return identifier;
		}
		case Token.Plus: {
			next(p.lexer);
			const value = parseExpression(p, tt.Precedence.Prefix);
			if ((p.lexer.token as number) === Token["**"]) {
				throw new Error("Unexpected token **");
			}

			return tt.unaryExpression("+", value);
		}
		case Token.Minus: {
			next(p.lexer);
			const value = parseExpression(p, tt.Precedence.Prefix);
			if ((p.lexer.token as number) === Token["**"]) {
				throw new Error("Unexpected token **");
			}

			return tt.unaryExpression("-", value);
		}
		case Token.Tilde: {
			next(p.lexer);
			const value = parseExpression(p, tt.Precedence.Prefix);
			if ((p.lexer.token as number) === Token["**"]) {
				throw new Error("Unexpected token **");
			}

			return tt.unaryExpression("~", value);
		}
		case Token["!"]: {
			next(p.lexer);
			const value = parseExpression(p, tt.Precedence.Prefix);
			if ((p.lexer.token as number) === Token["**"]) {
				throw new Error("Unexpected token **");
			}

			return tt.unaryExpression("!", value);
		}
		case Token["--"]: {
			next(p.lexer);
			const value = parseExpression(p, tt.Precedence.Prefix);
			return tt.updateExpression("--", value, true);
		}
		case Token["++"]: {
			next(p.lexer);
			const value = parseExpression(p, tt.Precedence.Prefix);
			return tt.updateExpression("++", value, true);
		}
		case Token.Function: {
			return parseFunctionExpression(p, false);
		}
		case Token.OpenBracket: {
			next(p.lexer);

			const items = [];
			while ((p.lexer.token as number) !== Token.CloseBracket) {
				switch (p.lexer.token as number) {
					case Token.Comma: {
						items.push(tt.emptyExpression());
						break;
					}
					// TODO: Spread
					default:
						const item = parseExpression(p, tt.Precedence.Lowest);
						items.push(item);
				}

				if ((p.lexer.token as number) !== Token.Comma) {
					break;
				}

				next(p.lexer);
			}

			expectToken(p.lexer, Token.CloseBracket);
			return tt.arrayExpression(items);
		}
		default: {
			console.log(p.lexer);
			throw new Error("fail #ac");
		}
	}
}

function parseSuffix(
	p: Parser,
	left: tt.Expression,
	level: number
): tt.Expression {
	while (true) {
		switch (p.lexer.token) {
			case Token["--"]: {
				if (level >= tt.Precedence.Postfix) {
					return left;
				}

				next(p.lexer);
				left = tt.updateExpression("--", left, false);
				break;
			}
			case Token["++"]: {
				if (level >= tt.Precedence.Postfix) {
					return left;
				}

				next(p.lexer);
				left = tt.updateExpression("++", left, false);
				break;
			}
			case Token["**"]: {
				if (level >= tt.Precedence.Exponentiation) {
					return left;
				}
				next(p.lexer);
				const right = parseExpression(p, tt.Precedence.Exponentiation - 1);
				left = tt.binaryExpression(left, right);
				break;
			}
			default:
				return left;
		}
	}
}

function parseParenExpression(p: Parser) {
	const items: tt.Expression[] = [];
	while (p.lexer.token !== Token.CloseParen) {
		// TODO: Spread
		const item = parseExpression(p, tt.Precedence.Comma);
		items.push(item);

		if (p.lexer.token !== Token.Comma) {
			break;
		}

		next(p.lexer);
	}

	expectToken(p.lexer, Token.CloseParen);

	// TODO: Async args

	// Is this a chain of expressions and comma operators?
	if (items.length > 0) {
		return tt.sequenceExpression(items);
	}

	return tt.emptyExpression();
}

// Assumes "async" keyword has been parsed already
function parseAsyncPrefixExpression(p: Parser) {
	switch (p.lexer.token) {
		case Token.Function:
			return parseFunctionExpression(p, true /* isAsync */);
	}

	return tt.emptyExpression();
}

function parseFunctionExpression(p: Parser, isAsync: boolean) {
	const isGenerator = p.lexer.token === Token["*"];
	if (p.lexer.token === Token["*"]) {
		next(p.lexer);
	}

	// TODO: Async

	// The name is optional
	let name = "";
	if (p.lexer.token === Token.Identifier) {
		name = p.lexer.identifier;
		// TODO: Don't declare name "arguments"
	}
	next(p.lexer);

	// Function body
	expectToken(p.lexer, Token.OpenParen);

	const args = [];
	while (p.lexer.token !== Token.CloseParen) {
		// TODO: Rest args
		// TODO: Default arguments

		const arg = parseBinding(p);
		args.push(arg);

		if (p.lexer.token !== Token.Comma) {
			break;
		}

		next(p.lexer);
	}

	expectToken(p.lexer, Token.CloseParen);

	const body = parseFunctionBody(p);
	return tt.functionDeclaration(name, args, body, isGenerator, isAsync);
}

function parseFunctionBody(p: Parser) {
	expectToken(p.lexer, Token.OpenBrace);
	const statements = parseStatementsUpTo(p, Token.CloseBrace);
	next(p.lexer);
	return tt.blockStatement(statements);
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
