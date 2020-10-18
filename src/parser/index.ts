import * as tt from "../ast";
import { CharFlags } from "../lexer-ascii";
import {
	nextToken2,
	Lexer2,
	expectToken2,
	consumeOp,
	getRaw,
	expectOrInsertSemicolon2,
} from "../lexer/index";
import { keywordTable, Token } from "../tokens";

export interface ParserState extends Lexer2 {}

export function parse(source: string): tt.Program {
	const state: ParserState = {
		token: Token.Unknown,
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
	return tt.program("module", statements, 0, state.end);
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
	while (state.token !== Token.EndOfFile) {
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
	const { start } = state;
	let label = null;

	switch (state.token) {
		case Token.SemiColon:
			return parseEmptyStatement(state);
		case Token.Function:
			return parseFunctionDeclartion(state);
		case Token.Break:
			label = parseLabel(state);
			return tt.breakStatement(label, start, state.end);
		case Token.Continue:
			label = parseLabel(state);
			return tt.continueStatement(label, start, state.end);
		case Token.Debugger:
			nextToken2(state);
			expectOrInsertSemicolon2(state);
			return tt.debuggerStatement(start, state.end);
		default:
			return parseExpressionOrLabelledStatement(state);
	}
}

function parseLabel(state: ParserState): tt.Expression | null {
	nextToken2(state);

	let name = null;
	if (state.token === Token.Identifier) {
		name = parseExpression(state);
	}

	expectOrInsertSemicolon2(state);
	return name;
}

// EmptyStatement ::
// ';'
function parseEmptyStatement(state: ParserState): tt.EmptyStatement {
	const start = state.start;
	nextToken2(state);
	return tt.emptyStatement(start, state.end);
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
	if (state.token === Token.Colon) {
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
	return tt.expressionStatement(expr, start, state.end);
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
	const start = state.start;
	const token = state.token;

	if (token === Token.StringLiteral) {
		const raw = getRaw(state);
		nextToken2(state);
		return tt.literal(state.string, raw, start, state.end);
	} else if ((token & Token.Literal) === Token.Literal) {
		const raw = getRaw(state);
		const value = token === Token.NumericLiteral ? Number(raw) : raw;
		nextToken2(state);
		return tt.literal(value, raw, start, state.end);
	} else if ((token & Token.UnaryExpression) === Token.UnaryExpression) {
		nextToken2(state);
		const value = parseExpression(state);
		const op = keywordTable[state.token & Token.FlagSpace] as any;
		return tt.unaryExpression(op, value, start, state.end);
	} else if ((token & Token.UpdateExpression) === Token.UpdateExpression) {
		nextToken2(state);
		const value = parseExpression(state);
		const op = keywordTable[state.token & Token.FlagSpace] as any;
		return tt.updateExpression(op, value, true, start, state.end);
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

	return tt.identifier(name, start, state.end);
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
	if ((state.token & Token.BinaryExpression) === Token.BinaryExpression) {
		const op = keywordTable[state.token & Token.FlagSpace] as any;
		nextToken2(state);
		const right = parseExpression(state);
		return tt.binaryExpression(op, left, right, left.start, state.end);
	} else if ((state.token & Token.AssignOp) === Token.AssignOp) {
		nextToken2(state);
		const right = parseExpression(state);
		return tt.assignmentExpression(left, right, left.start, state.end);
	}

	return left;
}

function parseFunctionDeclartion(state: ParserState) {
	const start = state.start;
	nextToken2(state);

	// TODO: Async
	const isAsync = false;
	const isGenerator = consumeOp(state, Token["*"]);

	// The name is optional
	let name = "";
	if (state.token === Token.Identifier) {
		name = state.value;
		// TODO: Don't declare name "arguments"
		nextToken2(state);
	}

	expectToken2(state, Token.OpenParen);

	const args = [];
	while (state.token !== Token.CloseParen) {
		// TODO: Rest args
		// TODO: Default arguments

		const arg = parseBinding(state);
		args.push(arg);

		if (state.token !== Token.Comma) {
			break;
		}

		nextToken2(state);
	}

	expectToken2(state, Token.CloseParen);

	const body = parseFunctionBody(state);
	return tt.functionDeclaration(
		name,
		args,
		body,
		isGenerator,
		isAsync,
		start,
		state.end
	);
}

function parseFunctionBody(state: ParserState) {
	return tt.blockStatement([]);
}
function parseBinding(state: ParserState) {}
