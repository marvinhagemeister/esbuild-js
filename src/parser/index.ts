import * as tt from "../ast";
import { CharFlags } from "../lexer-ascii";
import {
	nextToken2,
	Lexer2,
	expectToken2,
	consumeOp,
	getRaw,
} from "../lexer/index";
import { Token, TokenFlags } from "../tokens";

export interface ParserState extends Lexer2 {}

/**
 * Add mapping information to a node
 */
function finishNode(state: ParserState, start: number, node: any) {
	node.start = start;
	node.end = state.end; // TODO: Constant should not be necessary
	return node;
}

export function parse(source: string): tt.Program {
	const state: ParserState = {
		token: TokenFlags.Unknown,
		char: source.charCodeAt(0),
		column: 0,
		commentBefore: null,
		flags: CharFlags.Unknown,
		hasNewLineBefore: false,
		i: 0,
		end: 0,
		value: "",
		line: 0,
		number: 0,
		rescanCloseBraceAsTemplateToken: false,
		source,
		start: 0,
		string: "",
	};

	// Off we go!
	nextToken2(state);

	const statements = parseStatementList(state);
	const program = tt.program("module", statements);
	return finishNode(state, 0, program);
}

// ModuleItemList ::
//   ModuleItem
//   ModuleItemListModuleItem
//
// StatementList ::
//   StatementListItem
//   StatementList StatementListItem
function parseStatementList(state: ParserState) {
	const statements: tt.Statement[] = [];
	while (state.token !== TokenFlags.EndOfFile) {
		statements.push(parseStatement(state));
	}

	return statements;
}

// Statement ::
//   BlockStatement
//   VariableStatement
//   EmptyStatement
//   ExpressionStatement
//   IfStatement
//   BreakableStatement
//   ContinueStatement
//   BreakStatement
//   ReturnStatement
//   WithStatement
//   LabelledStatement
//   ThrowStatement
//   TryStatement
//   DebuggerStatement
function parseStatement(state: ParserState): tt.Statement {
	//
	switch (state.token) {
		case TokenFlags.SemiColon:
			return parseEmptyStatement(state);
		case TokenFlags.Function:
			return parseFunctionDeclartion(state);
		default:
			return parseExpressionOrLabelledStatement(state);
	}
}

// EmptyStatement ::
// ';'
function parseEmptyStatement(state: ParserState): tt.EmptyStatement {
	const start = state.start;
	nextToken2(state);
	return finishNode(state, start, tt.emptyStatement());
}

// ExpressionStatement :
//   [lookahead != `{`, `function`, `async` [no LineTerminator here] `function`, `class`, `let` `[` ] Expression `;`
//
// LabelledStatement :
//   LabelIdentifier : LabelledItem
//
// LabelledItem :
//   Statement
//   FunctionDeclaration
function parseExpressionOrLabelledStatement(
	state: ParserState
): tt.LabeledStatement | tt.ExpressionStatement {
	const name = getRaw(state);
	const start = state.start;

	let expr = parseLeftHandSideExpression(state);
	if (state.token === TokenFlags.Colon) {
		nextToken2(state);
		const body = parseStatement(state);
		return tt.labeledStatement(tt.identifier(name), body);
	}

	expr = parseAssignmentExpression(state, expr);
	return parseExpressionStatement(state, start, expr);
}

// ExpressionStatement :
//   [lookahead != `{`, `function`, `async` [no LineTerminator here] `function`, `class`, `let` `[` ] Expression `;`
function parseExpressionStatement(
	state: ParserState,
	start: number,
	expr: tt.Expression
) {
	return finishNode(state, start, tt.expressionStatement(expr));
}

// Expression :
//   AssignmentExpression
//   Expression `,` AssignmentExpression
function parseExpression(state: ParserState): tt.Expression {
	const expression = parseLeftHandSideExpression(state);
	return parseAssignmentExpression(state, expression);
}

// LeftHandSideExpression :
//  (PrimaryExpression | MemberExpression) ...
function parseLeftHandSideExpression(state: ParserState) {
	const raw = getRaw(state);
	const start = state.start;
	const token = state.token;

	if (token === TokenFlags.StringLiteral) {
		nextToken2(state);
		return finishNode(state, start, tt.literal(state.string, raw));
	} else if ((token & Token.Literal) === Token.Literal) {
		const value = token === TokenFlags.NumericLiteral ? Number(raw) : raw;
		nextToken2(state);
		return finishNode(state, start, tt.literal(value, raw));
	} else if ((token & Token.UnaryExpression) === Token.UnaryExpression) {
		nextToken2(state);
		const value = parseExpression(state);
		// FIXME: Operator type
		return finishNode(state, start, tt.unaryExpression("void", value));
	} else if ((token & Token.UpdateExpression) === Token.UpdateExpression) {
		nextToken2(state);
		const value = parseExpression(state);
		// FIXME: operator
		return finishNode(state, start, tt.updateExpression("--", value, true));
	} else {
		return parseIdentifier(state);
	}
}

function parseIdentifier(state: ParserState): tt.Identifier {
	const start = state.start;
	const name = getRaw(state);
	nextToken2(state);

	// TODO: async
	// TODO: await
	// TODO: yield

	const identifier = tt.identifier(name);
	return finishNode(state, start, identifier);
}

// AssignmentExpression :
//   ConditionalExpression
//   [+Yield] YieldExpression
//   ArrowFunction
//   AsyncArrowFunction
//   LeftHandSideExpression `=` AssignmentExpression
//   LeftHandSideExpression AssignmentOperator AssignmentExpression
//   LeftHandSideExpression LogicalAssignmentOperator AssignmentExpression
//
// AssignmentOperator : one of
//   *= /= %= += -= <<= >>= >>>= &= ^= |= **=
//
// LogicalAssignmentOperator : one of
//   &&= ||= ??=
function parseAssignmentExpression(state: ParserState, left: any) {
	if ((state.token & Token.AssignOp) === Token.AssignOp) {
		nextToken2(state);
		const right = parseExpression(state);
		return finishNode(state, left.start, tt.assignmentExpression(left, right));
	}

	return left;
}

function parseFunctionDeclartion(state: ParserState) {
	const start = state.start;
	nextToken2(state);

	// TODO: Async
	const isAsync = false;
	const isGenerator = consumeOp(state, TokenFlags["*"]);

	// The name is optional
	let name = "";
	if (state.token === TokenFlags.Identifier) {
		name = state.value;
		// TODO: Don't declare name "arguments"
		nextToken2(state);
	}

	expectToken2(state, TokenFlags.OpenParen);

	const args = [];
	while (state.token !== TokenFlags.CloseParen) {
		// TODO: Rest args
		// TODO: Default arguments

		const arg = parseBinding(state);
		args.push(arg);

		if (state.token !== TokenFlags.Comma) {
			break;
		}

		nextToken2(state);
	}

	expectToken2(state, TokenFlags.CloseParen);

	const body = parseFunctionBody(state);
	return finishNode(
		state,
		start,
		tt.functionDeclaration(name, args, body, isGenerator, isAsync)
	);
}

function parseFunctionBody(state: ParserState) {
	return tt.blockStatement([]);
}
function parseBinding(state: ParserState) {}
