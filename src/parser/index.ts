import * as tt from "../ast";
import { CharFlags } from "../lexer-ascii";
import {
	scanSingleToken,
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
function finishNode(state: ParserState, node: any) {
	node.start = -1;
	node.end = -1;
	return node;
}

// ModuleItemList ::
//   ModuleItem
//   ModuleItemListModuleItem
//
// StatementList ::
//   StatementListItem
//   StatementList StatementListItem
function parseStatementList(state: ParserState) {
	const statements = [];
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
function parseStatement(state: ParserState) {
	//
	switch (state.token) {
		case Token.SemiColon:
			return parseEmptyStatement(state);
		case Token.Function:
			return parseFunctionDeclartion(state);
	}
}

// EmptyStatement ::
// ';'
function parseEmptyStatement(state: ParserState): tt.EmptyStatement {
	scanSingleToken(state);
	return finishNode(state, tt.emptyStatement());
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
	const token = state.token;
	if ((token & Token.Literal) === Token.Literal) {
		scanSingleToken(state);
		return finishNode(state, tt.literal("FIXME"));
	} else if ((token & Token.UnaryExpression) === Token.UnaryExpression) {
		scanSingleToken(state);
		const value = parseExpression(state);
		// FIXME: Operator type
		return finishNode(state, tt.unaryExpression("void", value));
	} else if ((token & Token.UpdateExpression) === Token.UpdateExpression) {
		scanSingleToken(state);
		const value = parseExpression(state);
		// FIXME: operator
		return finishNode(state, tt.updateExpression("--", value, true));
	} else {
		return parseIdentifier(state);
	}
}

function parseIdentifier(state: ParserState): tt.Identifier {
	const name = state.identifier;
	const raw = getRaw(state);
	scanSingleToken(state);

	switch (name) {
		case "async": {
			if (raw === "async") {
				// return parseAsyncPrefixExpression(p);
			}

			break;
			// TODO: await
			// TODO: yield
		}
	}

	const identifier = tt.identifier(name);
	return finishNode(state, identifier);
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
		scanSingleToken(state);
		const right = parseExpression(state);
		return finishNode(state, right);
	}

	return left;
}

function parseFunctionDeclartion(state: ParserState) {
	scanSingleToken(state);

	// TODO: Async
	const isAsync = false;
	const isGenerator = consumeOp(state, Token["*"]);

	// The name is optional
	let name = "";
	if (state.token === Token.Identifier) {
		name = state.identifier;
		// TODO: Don't declare name "arguments"
		scanSingleToken(state);
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

		scanSingleToken(state);
	}

	expectToken2(state, Token.CloseParen);

	const body = parseFunctionBody(state);
	return finishNode(
		state,
		tt.functionDeclaration(name, args, body, isGenerator, isAsync)
	);
}

function parseFunctionBody(state: ParserState) {}
function parseBinding(state: ParserState) {}

export function parse(source: string): tt.Program {
	const state: ParserState = {
		token: Token.Unknown,
		char: 0,
		column: 0,
		commentBefore: null,
		flags: CharFlags.Unknown,
		hasNewLineBefore: false,
		i: 0,
		identifier: "",
		line: 0,
		number: 0,
		rescanCloseBraceAsTemplateToken: false,
		source,
		start: 0,
		string: "",
	};

	// Off we go!
	scanSingleToken(state);

	const statements = parseStatementList(state);
	const program = tt.program("module", statements);
	return program;
}
