import { Token } from "../tokens";

export interface ParserState {
	foo: any;
	token: Token;
}

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
function parseModuleItemList(state: ParserState) {
	const statements = parseStatementList(state);
}

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
	}
}
