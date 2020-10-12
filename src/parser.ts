import {
	expectOrInsertSemicolon,
	expectToken,
	getRaw,
	isContextualKeyword,
	Lexer,
	newLexer,
	nextToken,
} from "./lexer";
import { strictModeReservedWords } from "./lexer_helpers";
import { Token } from "./tokens";
import * as tt from "./ast";
import { Property } from "estree";

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
		nextToken(lexer);
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
			nextToken(p.lexer);
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
			nextToken(p.lexer);
			break;
		}
		case Token.Function:
			nextToken(p.lexer);
			return parseFunctionExpression(p, false);
		case Token.Const:
		case Token.Var: {
			const kind: tt.VariableDeclaration["kind"] =
				p.lexer.token === Token.Const
					? "const"
					: getRaw(p.lexer) === "let"
					? "let"
					: "var";
			nextToken(p.lexer);

			const declarations = parseDeclarations(p);
			return tt.variableDeclaration(kind, declarations);
		}
		case Token.SemiColon:
			nextToken(p.lexer);
			return tt.emptyStatement("");
		case Token.For: {
			nextToken(p.lexer);

			// TODO: "for await (let x of y) {}"
			expectToken(p.lexer, Token.OpenParen);

			// TODO: Disallow in expressions
			let init: tt.Expression | tt.VariableDeclaration | null = null;
			let test: tt.Expression | null = null;
			let update: tt.Expression | null = null;
			switch (p.lexer.token as number) {
				case Token.Var: {
					nextToken(p.lexer);
					const declarations = parseDeclarations(p);
					if (declarations.length > 0) {
						init = tt.variableDeclaration("var", declarations);
					}
					break;
				}
				case Token.Const:
					nextToken(p.lexer);
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
				nextToken(p.lexer);
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
				nextToken(p.lexer);
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
				nextToken(p.lexer);
				if ((p.lexer.token as number) === Token.Function) {
					nextToken(p.lexer);
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

	nextToken(p.lexer);

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
			nextToken(p.lexer);
			value = parseExpression(p, tt.Precedence.Comma);
		}

		const decl = tt.variableDeclarator(binding, value);
		declarations.push(decl);
		if (p.lexer.token !== Token.Comma) {
			break;
		}

		nextToken(p.lexer);
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
			nextToken(p.lexer);
			return parseParenExpression(p);
		}
		case Token.False:
			nextToken(p.lexer);
			return tt.literal(false);
		case Token.True:
			nextToken(p.lexer);
			return tt.literal(true);
		case Token.Null:
			nextToken(p.lexer);
			return tt.literal(null);
		case Token.StringLiteral: {
			const value = p.lexer.string;
			nextToken(p.lexer);
			return tt.literal(value);
		}
		case Token.NumericLiteral: {
			const value = p.lexer.number;
			nextToken(p.lexer);
			return tt.literal(value);
		}
		case Token.Void: {
			nextToken(p.lexer);
			const value = parseExpression(p, tt.Precedence.Prefix);
			return tt.unaryExpression("void", value);
		}
		case Token.Typeof: {
			nextToken(p.lexer);
			const value = parseExpression(p, tt.Precedence.Prefix);
			return tt.unaryExpression("typeof", value);
		}
		case Token.Delete: {
			nextToken(p.lexer);
			const value = parseExpression(p, tt.Precedence.Prefix);
			return tt.unaryExpression("delete", value);
		}
		case Token.Identifier: {
			const name = p.lexer.identifier;
			const raw = getRaw(p.lexer);
			nextToken(p.lexer);

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
			nextToken(p.lexer);
			const value = parseExpression(p, tt.Precedence.Prefix);
			if ((p.lexer.token as number) === Token["**"]) {
				throw new Error("Unexpected token **");
			}

			return tt.unaryExpression("+", value);
		}
		case Token.Minus: {
			nextToken(p.lexer);
			const value = parseExpression(p, tt.Precedence.Prefix);
			if ((p.lexer.token as number) === Token["**"]) {
				throw new Error("Unexpected token **");
			}

			return tt.unaryExpression("-", value);
		}
		case Token.Tilde: {
			nextToken(p.lexer);
			const value = parseExpression(p, tt.Precedence.Prefix);
			if ((p.lexer.token as number) === Token["**"]) {
				throw new Error("Unexpected token **");
			}

			return tt.unaryExpression("~", value);
		}
		case Token["!"]: {
			nextToken(p.lexer);
			const value = parseExpression(p, tt.Precedence.Prefix);
			if ((p.lexer.token as number) === Token["**"]) {
				throw new Error("Unexpected token **");
			}

			return tt.unaryExpression("!", value);
		}
		case Token["--"]: {
			nextToken(p.lexer);
			const value = parseExpression(p, tt.Precedence.Prefix);
			return tt.updateExpression("--", value, true);
		}
		case Token["++"]: {
			nextToken(p.lexer);
			const value = parseExpression(p, tt.Precedence.Prefix);
			return tt.updateExpression("++", value, true);
		}
		case Token.Function: {
			return parseFunctionExpression(p, false);
		}
		case Token.Class: {
			nextToken(p.lexer);

			let name = null;
			if (
				(p.lexer.token as number) === Token.Identifier &&
				!strictModeReservedWords.has(p.lexer.identifier)
			) {
				name = p.lexer.identifier;
				nextToken(p.lexer);
			}

			return parseClass(p, name);
		}
		case Token.OpenBracket: {
			nextToken(p.lexer);

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

				nextToken(p.lexer);
			}

			expectToken(p.lexer, Token.CloseBracket);
			return tt.arrayExpression(items);
		}
		case Token.OpenBrace: {
			nextToken(p.lexer);

			const properties = [];
			while ((p.lexer.token as number) !== Token.CloseBrace) {
				// TODO: Spread
				const property = parseProperty(p, tt.PropertyKind.Normal, false);
				if (property) {
					properties.push(property);
				}
			}

			expectToken(p.lexer, Token.CloseBrace);
			return tt.objectExpression(properties);
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

				nextToken(p.lexer);
				left = tt.updateExpression("--", left, false);
				break;
			}
			case Token["++"]: {
				if (level >= tt.Precedence.Postfix) {
					return left;
				}

				nextToken(p.lexer);
				left = tt.updateExpression("++", left, false);
				break;
			}
			case Token["**"]: {
				if (level >= tt.Precedence.Exponentiation) {
					return left;
				}
				nextToken(p.lexer);
				const right = parseExpression(p, tt.Precedence.Exponentiation - 1);
				left = tt.binaryExpression(left, right);
				break;
			}
			default:
				return left;
		}
	}
}

function parseClass(p: Parser, name: string | null) {
	let extend = null;
	if (p.lexer.token === Token.Extends) {
		nextToken(p.lexer);
		extend = parseExpression(p, tt.Precedence.New);
	}

	expectToken(p.lexer, Token.OpenBrace);

	const properties: tt.Property[] = [];
	while (p.lexer.token !== Token.CloseBrace) {
		if (p.lexer.token === Token.SemiColon) {
			nextToken(p.lexer);
			continue;
		}

		const property = parseProperty(p, tt.PropertyKind.Normal, true);
		properties.push(property);
	}

	expectToken(p.lexer, Token.CloseBrace);
	return tt.classDeclaration(
		name === null ? null : tt.identifier(name),
		extend,
		properties
	);
}

function parseProperty(p: Parser, kind: tt.PropertyKind, isClass: boolean) {
	let key = null;
	let isComputed = false;
	switch (p.lexer.token) {
		case Token.NumericLiteral: {
			const raw = getRaw(p.lexer);
			// FIXME: Number literals
			key = tt.literal(Number(raw));
			nextToken(p.lexer);
			break;
		}
		case Token.OpenBracket: {
			isComputed = true;
			nextToken(p.lexer);
			const expression = parseExpression(p, tt.Precedence.Comma);
			expectToken(p.lexer, Token.CloseBracket);
			key = expression;
			break;
		}
		default:
			const name = p.lexer.identifier;
			// TODO: Check identifier or keyword
			nextToken(p.lexer);

			// TODO: Check generator
			// TODO: Check modifier keyword

			// TODO: Treat name as unicode
			key = tt.identifier(name);

			// Check shorthand property
			if (
				!isClass &&
				kind === tt.PropertyKind.Normal &&
				p.lexer.token !== Token.Colon &&
				p.lexer.token !== Token.OpenParen
			) {
				return tt.property(key, key, false, false);
			}
	}

	// Parse a class field with optional initial value
	if (
		isClass &&
		kind === tt.PropertyKind.Normal &&
		p.lexer.token !== Token.OpenParen
	) {
		expectOrInsertSemicolon(p.lexer);
		let value = tt.emptyExpression();
		return tt.property(key, value, isComputed, false);
	}

	// Parse method
	if (p.lexer.token === Token.OpenParen || isClass) {
		// TODO: Disallow name "constructor" and "prototypes" here
		// TODO: Async
		// TODO: Generators
		// TODO: super()
		const value = parseFunctionExpression(p, false);

		// TODO: Getter + Setter
		// TODO: Private identifiers
		return tt.property(key, value, false, true);
	}

	expectToken(p.lexer, Token.Colon);
	const value = parseExpression(p, tt.Precedence.Comma);
	return tt.property(key, value, isComputed, false);
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

		nextToken(p.lexer);
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
		nextToken(p.lexer);
	}

	// TODO: Async

	// The name is optional
	let name = "";
	if (p.lexer.token === Token.Identifier) {
		name = p.lexer.identifier;
		// TODO: Don't declare name "arguments"
		nextToken(p.lexer);
	}

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

		nextToken(p.lexer);
	}

	expectToken(p.lexer, Token.CloseParen);

	const body = parseFunctionBody(p);
	return tt.functionDeclaration(name, args, body, isGenerator, isAsync);
}

function parseFunctionBody(p: Parser) {
	expectToken(p.lexer, Token.OpenBrace);
	const statements = parseStatementsUpTo(p, Token.CloseBrace);
	nextToken(p.lexer);
	return tt.blockStatement(statements);
}

function parseBinding(p: Parser): tt.Identifier | tt.ObjectPattern {
	//

	switch (p.lexer.token) {
		case Token.Identifier: {
			const name = p.lexer.identifier;
			nextToken(p.lexer);
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

				const property = tt.property(binding, binding, false, false);
				properties.push(property);
				nextToken(p.lexer);
			}

			return tt.objectPattern(properties);
		}
		case Token.OpenBrace: {
			nextToken(p.lexer);

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
			nextToken(p.lexer);
			const value = tt.identifier(p.lexer.identifier);
			// TODO: Expect identifier
			return tt.restElement(value);
		case Token.NumericLiteral: {
			break;
		}
	}

	throw new Error("fail 3");
}
