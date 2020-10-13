import {
	expectOrInsertSemicolon,
	expectToken,
	getRaw,
	isContextualKeyword,
	isIdentifierOrKeyword,
	Lexer,
	newLexer,
	nextToken,
	scanRegExp,
} from "./lexer";
import { formatLexerPosition, strictModeReservedWords } from "./lexer_helpers";
import { Token } from "./tokens";
import * as tt from "./ast";

// TODO: Sourcemap
// TODO: Sourcelocation
// TODO: Error handling

export interface Parser {
	lexer: Lexer;
	allowIn: boolean;
}

export function newParser(lexer: Lexer): Parser {
	// TODO: This may seem redundant but we'll need this to be an object
	// to hold scope information, the current ECMA version and other
	// things later.
	return {
		lexer,
		allowIn: true,
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

	const statements = parseStatementsUpTo(parser, Token.EndOfFile);
	const program = tt.program("module", statements as any);
	program.hashbang = hashbang;
	return program;
}

function parseStatementsUpTo(p: Parser, end: Token) {
	const statements: tt.Statement[] = [];

	while (true) {
		if (p.lexer.commentBefore !== null && p.lexer.commentBefore.length > 0) {
			const comments = p.lexer.commentBefore;
			for (let i = 0; i < comments.length; i++) {
				statements.push(tt.comment(comments[i]));
			}
			p.lexer.commentBefore = null;
		}

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
		case Token.SemiColon:
			nextToken(p.lexer);
			return tt.emptyStatement("");
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
		case Token.If: {
			nextToken(p.lexer);
			expectToken(p.lexer, Token.OpenParen);
			const test = parseExpression(p, tt.Precedence.Lowest);
			expectToken(p.lexer, Token.CloseParen);
			const body = parseStatement(p);

			let alternate = null;
			if ((p.lexer.token as number) === Token.Else) {
				nextToken(p.lexer);
				alternate = parseStatement(p);
			}

			return tt.ifStatement(test, body, alternate);
		}
		case Token.While: {
			nextToken(p.lexer);
			expectToken(p.lexer, Token.OpenParen);
			const test = parseExpression(p, tt.Precedence.Lowest);
			expectToken(p.lexer, Token.CloseParen);
			const body = parseStatement(p);
			return tt.whileStatement(test, body);
		}
		case Token.Try: {
			nextToken(p.lexer);
			expectToken(p.lexer, Token.OpenBrace);
			const body = parseStatementsUpTo(p, Token.CloseBrace);
			nextToken(p.lexer);

			let handler: tt.CatchClause | null = null;
			let finallyHandler: tt.Statement | null = null;

			// catch-clause
			if ((p.lexer.token as number) === Token.Catch) {
				nextToken(p.lexer);
				// TODO: Optional catch binding
				expectToken(p.lexer, Token.OpenParen);
				const value = parseBinding(p);
				expectToken(p.lexer, Token.CloseParen);

				expectToken(p.lexer, Token.OpenBrace);
				const body = parseStatementsUpTo(p, Token.CloseBrace);
				nextToken(p.lexer);

				handler = tt.catchClause(value, tt.blockStatement(body));
			}

			// finally clause
			if ((p.lexer.token as number) === Token.Finally) {
				expectToken(p.lexer, Token.Finally);
				expectToken(p.lexer, Token.OpenBrace);
				const body = parseStatementsUpTo(p, Token.CloseBrace);
				nextToken(p.lexer);
				finallyHandler = tt.blockStatement(body);
			}

			// TODO: Finally
			return tt.tryStatement(tt.blockStatement(body), handler, finallyHandler);
		}
		case Token.For: {
			nextToken(p.lexer);

			// TODO: "for await (let x of y) {}"
			expectToken(p.lexer, Token.OpenParen);

			// "in" expressions aren't allowed here
			p.allowIn = false;

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

			// "in" expressions are allowed again
			p.allowIn = true;

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
		case Token.Break: {
			nextToken(p.lexer);
			const name = parseLabelName(p);
			expectOrInsertSemicolon(p.lexer);
			return tt.breakStatement(name ? tt.identifier(name) : null);
		}
		case Token.Continue: {
			nextToken(p.lexer);
			const name = parseLabelName(p);
			expectOrInsertSemicolon(p.lexer);
			return tt.continueStatement(name ? tt.identifier(name) : null);
		}
		case Token.Return: {
			nextToken(p.lexer);
			let value: tt.Expression | null = null;
			switch (p.lexer.token as number) {
				case Token.SemiColon:
				case Token.CloseBrace:
				case Token.EndOfFile:
					break;
				default:
					if (!p.lexer.hasNewLineBefore) {
						value = parseExpression(p, tt.Precedence.Lowest);
					}
			}
			expectOrInsertSemicolon(p.lexer);
			return tt.returnStatement(value);
		}
		case Token.Throw: {
			nextToken(p.lexer);
			const value = parseExpression(p, tt.Precedence.Lowest);
			return tt.throwStatement(value);
		}
		case Token.Debugger: {
			nextToken(p.lexer);
			expectOrInsertSemicolon(p.lexer);
			return tt.debuggerStatement();
		}
		case Token.OpenBrace: {
			nextToken(p.lexer);
			const statements = parseStatementsUpTo(p, Token.CloseBrace);
			nextToken(p.lexer);
			return tt.blockStatement(statements);
		}
		default:
			const isIdentifier = p.lexer.token === Token.Identifier;
			const name = p.lexer.identifier;

			// Parse either an async function, an async expression, or a normal expression
			if (isIdentifier && getRaw(p.lexer) === "async") {
				nextToken(p.lexer);
				if ((p.lexer.token as number) === Token.Function) {
					nextToken(p.lexer);
					return parseFunctionExpression(p, true);
				}
			}

			const out = parseExpressionOrLetStatement(p);
			if (out && out.type === "VariableDeclaration") {
				expectOrInsertSemicolon(p.lexer);
				return out;
			}

			if (isIdentifier && p.lexer.token === Token.Colon) {
				nextToken(p.lexer);
				const body = parseStatement(p);
				return tt.labeledStatement(tt.identifier(name), body);
			}

			expectOrInsertSemicolon(p.lexer);
			if (out) {
				return tt.expressionStatement(out);
			}
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

	return null as any;
}

function parseLabelName(p: Parser) {
	if (p.lexer.token !== Token.Identifier || p.lexer.hasNewLineBefore) {
		return null;
	}

	const name = p.lexer.identifier;
	nextToken(p.lexer);
	return name;
}

function parseDeclarations(p: Parser): tt.VariableDeclarator[] {
	const declarations: tt.VariableDeclarator[] = [];

	while (true) {
		if (p.lexer.token === Token.EndOfFile) {
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
		case Token.This:
			nextToken(p.lexer);
			return tt.thisExpression();
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
		case Token["/"]: {
			scanRegExp(p.lexer);
			const raw = getRaw(p.lexer);
			nextToken(p.lexer);
			return tt.regexpLiteral(raw);
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
			nextToken(p.lexer);
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
		case Token.New: {
			nextToken(p.lexer);

			const callee = parseExpression(p, tt.Precedence.Member);

			let args: tt.Expression[] = [];
			if ((p.lexer.token as number) === Token.OpenParen) {
				args = parseCallArgs(p);
			}

			return tt.newExpression(callee, args);
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
			console.log(formatLexerPosition(p.lexer));
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
			case Token.Dot: {
				nextToken(p.lexer);
				// a.b
				if (!isIdentifierOrKeyword(p.lexer)) {
					expectToken(p.lexer, Token.Identifier);
				}

				const name = p.lexer.identifier;
				nextToken(p.lexer);
				left = tt.memberExpression(left, tt.identifier(name), false);
				break;
			}
			case Token.OpenBracket: {
				nextToken(p.lexer);
				const index = parseExpression(p, tt.Precedence.Lowest);
				expectToken(p.lexer, Token.CloseBracket);
				left = tt.memberExpression(left, index, true);
				break;
			}
			case Token.OpenParen: {
				if (level >= tt.Precedence.Call) {
					return left;
				}

				const args = parseCallArgs(p);
				left = tt.callExpression(left, args);
				break;
			}
			case Token.Question: {
				if (level >= tt.Precedence.Conditional) {
					return left;
				}
				nextToken(p.lexer);
				const body = parseExpression(p, tt.Precedence.Comma);
				expectToken(p.lexer, Token.Colon);
				const alternate = parseExpression(p, tt.Precedence.Comma);
				left = tt.conditionalExpression(left, body, alternate);
				break;
			}
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
			case Token.Plus: {
				if (level >= tt.Precedence.Add) {
					return left;
				}
				nextToken(p.lexer);
				left = tt.binaryExpression(
					"+",
					left,
					parseExpression(p, tt.Precedence.Add)
				);
				break;
			}
			case Token["+="]: {
				if (level >= tt.Precedence.Assign) {
					return left;
				}
				nextToken(p.lexer);
				left = tt.binaryExpression(
					"+=",
					left,
					parseExpression(p, tt.Precedence.Assign - 1)
				);
				break;
			}
			case Token.Minus: {
				if (level >= tt.Precedence.Add) {
					return left;
				}
				nextToken(p.lexer);
				left = tt.binaryExpression(
					"-",
					left,
					parseExpression(p, tt.Precedence.Add)
				);
				break;
			}
			case Token["-="]: {
				if (level >= tt.Precedence.Assign) {
					return left;
				}
				nextToken(p.lexer);
				left = tt.binaryExpression(
					"-=",
					left,
					parseExpression(p, tt.Precedence.Assign - 1)
				);
				break;
			}
			case Token["/"]: {
				if (level >= tt.Precedence.Multiply) {
					return left;
				}
				nextToken(p.lexer);
				left = tt.binaryExpression(
					"/",
					left,
					parseExpression(p, tt.Precedence.Multiply)
				);
				break;
			}
			case Token["/="]: {
				if (level >= tt.Precedence.Assign) {
					return left;
				}
				nextToken(p.lexer);
				left = tt.binaryExpression(
					"/=",
					left,
					parseExpression(p, tt.Precedence.Assign - 1)
				);
				break;
			}
			case Token["*"]: {
				if (level >= tt.Precedence.Multiply) {
					return left;
				}
				nextToken(p.lexer);
				left = tt.binaryExpression(
					"*",
					left,
					parseExpression(p, tt.Precedence.Multiply)
				);
				break;
			}
			case Token["*="]: {
				if (level >= tt.Precedence.Assign) {
					return left;
				}
				nextToken(p.lexer);
				left = tt.binaryExpression(
					"*=",
					left,
					parseExpression(p, tt.Precedence.Assign - 1)
				);
				break;
			}
			case Token["**"]: {
				if (level >= tt.Precedence.Exponentiation) {
					return left;
				}
				nextToken(p.lexer);
				const right = parseExpression(p, tt.Precedence.Exponentiation - 1);
				left = tt.binaryExpression("**", left, right);
				break;
			}
			case Token["=="]: {
				const res = parseEqualSuffix(p, "==", left, level);
				if (res === null) return left;
				left = res;
				break;
			}
			case Token["!="]: {
				const res = parseEqualSuffix(p, "!=", left, level);
				if (res === null) return left;
				left = res;
				break;
			}
			case Token["==="]: {
				const res = parseEqualSuffix(p, "===", left, level);
				if (res === null) return left;
				left = res;
				break;
			}
			case Token["!=="]: {
				const res = parseEqualSuffix(p, "!==", left, level);
				if (res === null) return left;
				left = res;
				break;
			}
			case Token["<"]: {
				const res = parseCompareSuffix(p, "<", left, level);
				if (res === null) return left;
				left = res;
				break;
			}
			case Token["<="]: {
				const res = parseCompareSuffix(p, "<=", left, level);
				if (res === null) return left;
				left = res;
				break;
			}
			case Token[">"]: {
				const res = parseCompareSuffix(p, ">", left, level);
				if (res === null) return left;
				left = res;
				break;
			}
			case Token[">="]: {
				const res = parseCompareSuffix(p, ">=", left, level);
				if (res === null) return left;
				left = res;
				break;
			}
			case Token["||"]: {
				if (level >= tt.Precedence.OR) {
					return left;
				}

				nextToken(p.lexer);
				const right = parseExpression(p, tt.Precedence.Equals);
				left = tt.binaryExpression("||", left, right);
				break;
			}
			case Token["&&"]: {
				if (level >= tt.Precedence.OR) {
					return left;
				}

				nextToken(p.lexer);
				const right = parseExpression(p, tt.Precedence.Equals);
				left = tt.binaryExpression("&&", left, right);
				break;
			}
			case Token.Equals: {
				if (level >= tt.Precedence.Assign) {
					return left;
				}

				nextToken(p.lexer);
				const value = parseExpression(p, tt.Precedence.Assign - 1);
				left = tt.assignmentExpression(left, value);
				break;
			}
			case Token.In: {
				if (level >= tt.Precedence.Compare || !p.allowIn) {
					return left;
				}

				nextToken(p.lexer);
				const right = parseExpression(p, tt.Precedence.Compare);
				left = tt.binaryExpression("in", left, right);
				break;
			}
			default:
				return left;
		}
	}
}

function parseCallArgs(p: Parser): tt.Expression[] {
	const oldAllowIn = p.allowIn;
	p.allowIn = true;
	expectToken(p.lexer, Token.OpenParen);

	const args: tt.Expression[] = [];
	while (p.lexer.token !== Token.CloseParen) {
		// TODO: Spread
		const arg = parseExpression(p, tt.Precedence.Comma);
		args.push(arg);

		if (p.lexer.token !== Token.Comma) {
			break;
		}
		nextToken(p.lexer);
	}

	expectToken(p.lexer, Token.CloseParen);
	p.allowIn = oldAllowIn;
	return args;
}

function parseEqualSuffix(
	p: Parser,
	operator: tt.BinaryExpression["operator"],
	left: tt.Expression,
	level: number
) {
	if (level >= tt.Precedence.Equals) {
		return null;
	}

	nextToken(p.lexer);
	const right = parseExpression(p, tt.Precedence.Equals);
	return tt.binaryExpression(operator, left, right);
}

function parseCompareSuffix(
	p: Parser,
	operator: tt.BinaryExpression["operator"],
	left: tt.Expression,
	level: number
): null | tt.Expression {
	if (level >= tt.Precedence.Compare) {
		return null;
	}

	nextToken(p.lexer);
	const right = parseExpression(p, tt.Precedence.Compare);
	return tt.binaryExpression(operator, left, right);
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
			// FIXME: Add proper Number literals, so that we can print
			// numbers in their original form in the input code
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
	const oldAllowIn = p.allowIn;
	p.allowIn = true;

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

	p.allowIn = oldAllowIn;
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
