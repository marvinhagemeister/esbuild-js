// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence
export const enum Precedence {
	Lowest,
	/** , */
	Comma,
	/** yield */
	Yield,
	/** = */
	Assign,
	/** ternary: ... ? ... : ... */
	Conditional,
	/** ?? */
	NullishCoalescing,
	/** || */
	OR,
	/** && */
	AND,
	/** | */
	BitwiseOR,
	/** ^ */
	BitwiseXOR,
	/** & */
	BitwiseAND,
	Equals,
	Compare,
	BitwiseShift,
	Add,
	Multiply,
	Exponentiation,
	Prefix,
	Postfix,
	New,
	Call,
	Member,
}

export interface BaseNode {
	type: string;
	start: number;
	end: number;
}

export type AstNode =
	| Directive
	| Identifier
	| Program
	| VariableDeclarator
	| Statement
	| Pattern
	| Property
	| Expression;

export type Expression =
	| Literal
	| RegExpLiteral
	| Identifier
	| MemberExpression
	| CallExpression
	| NewExpression
	| ThisExpression
	| ConditionalExpression
	| ArrayExpression
	| FunctionDeclaration
	| ObjectPattern
	| SequenceExpression
	| UpdateExpression
	| BinaryExpression
	| UnaryExpression
	| ClassDeclaration
	| ObjectExpression
	| AssignmentExpression
	| EmptyExpression;

export interface EmptyExpression extends BaseNode {
	type: "EmptyExpression";
}

export function emptyExpression(start = 0, end = 0): EmptyExpression {
	return {
		type: "EmptyExpression",
		start,
		end,
	};
}

export interface EmptyStatement extends BaseNode {
	type: "EmptyStatement";
}

export function emptyStatement(start = 0, end = 0): EmptyStatement {
	return {
		type: "EmptyStatement",
		start,
		end,
	};
}

export interface Literal extends BaseNode {
	type: "Literal";

	value: string | number | boolean | null | undefined;
	raw: string;
}
export function literal(
	value: Literal["value"],
	raw: string,
	start = 0,
	end = 0
): Literal {
	return {
		type: "Literal",
		value,
		raw,
		start,
		end,
	};
}

export interface RegExpLiteral extends BaseNode {
	type: "RegExpLiteral";
	value: string;
}
export function regexpLiteral(
	value: string,
	start = 0,
	end = 0
): RegExpLiteral {
	return {
		type: "RegExpLiteral",
		value,
		end,
		start,
	};
}

export interface Comment extends BaseNode {
	type: "Comment";
	text: string;
}
export function comment(text: string, start = 0, end = 0): Comment {
	return {
		type: "Comment",
		text,
		start,
		end,
	};
}

export interface ArrayExpression extends BaseNode {
	type: "ArrayExpression";
	elements: Expression[];
}
export function arrayExpression(
	elements: ArrayExpression["elements"],
	start = 0,
	end = 0
): ArrayExpression {
	return {
		type: "ArrayExpression",
		elements,
		start,
		end,
	};
}

export interface CallExpression extends BaseNode {
	type: "CallExpression";
	callee: Expression;
	arguments: Expression[];
}
export function callExpression(
	callee: Expression,
	callArguments: Expression[],
	start = 0,
	end = 0
): CallExpression {
	return {
		type: "CallExpression",
		callee,
		arguments: callArguments,
		end,
		start,
	};
}

export interface NewExpression extends BaseNode {
	type: "NewExpression";
	callee: Expression;
	arguments: Expression[];
}
export function newExpression(
	callee: Expression,
	callArguments: Expression[],
	start = 0,
	end = 0
): NewExpression {
	return {
		type: "NewExpression",
		callee,
		arguments: callArguments,
		end,
		start,
	};
}

export interface ThisExpression extends BaseNode {
	type: "ThisExpression";
}
export function thisExpression(start = 0, end = 0): ThisExpression {
	return {
		type: "ThisExpression",
		end,
		start,
	};
}

export interface BinaryExpression extends BaseNode {
	type: "BinaryExpression";
	left: Expression;
	operator:
		| "+"
		| "-"
		| "*"
		| "/"
		| "**"
		| "<"
		| "<="
		| ">"
		| ">="
		| "=="
		| "!="
		| "==="
		| "!=="
		| "||"
		| "&&"
		| "+="
		| "-="
		| "*="
		| "/="
		| "in";
	right: Expression;
}
export function binaryExpression(
	operator: BinaryExpression["operator"],
	left: Expression,
	right: Expression,
	start = 0,
	end = 0
): BinaryExpression {
	return {
		type: "BinaryExpression",
		left,
		right,
		operator,
		start,
		end,
	};
}

export interface FunctionDeclaration extends BaseNode {
	type: "FunctionDeclaration";
	name: string;
	params: any[];
	body: BlockStatement;
	generator: boolean;
	async: boolean;
}
export function functionDeclaration(
	name: string,
	params: any[],
	body: BlockStatement,
	generator: boolean,
	async: boolean,
	start = 0,
	end = 0
): FunctionDeclaration {
	return {
		type: "FunctionDeclaration",
		name,
		generator,
		params,
		body,
		async,
		start,
		end,
	};
}

export type Pattern = ObjectPattern;

export interface VariableDeclarator extends BaseNode {
	type: "VariableDeclarator";
	id: Identifier | ObjectPattern;
	init: Expression | null;
}

export function variableDeclarator(
	id: VariableDeclarator["id"],
	init: VariableDeclarator["init"],
	start = 0,
	end = 0
): VariableDeclarator {
	return {
		type: "VariableDeclarator",
		id,
		init,
		start,
		end,
	};
}

export interface VariableDeclaration extends BaseNode {
	type: "VariableDeclaration";
	kind: "var" | "let" | "const";
	declarations: VariableDeclarator[];
}

export function variableDeclaration(
	kind: VariableDeclaration["kind"],
	declarations: VariableDeclaration["declarations"],
	start = 0,
	end = 0
): VariableDeclaration {
	return {
		type: "VariableDeclaration",
		kind,
		declarations,
		start,
		end,
	};
}

export interface Directive extends BaseNode {
	type: "Directive";
	directive: string;
}

export type Declaration = VariableDeclaration;
export type Statement =
	| Declaration
	| ForStatement
	| ForOfStatement
	| ForInStatement
	| FunctionDeclaration
	| CatchClause
	| EmptyStatement
	| DebuggerStatement
	| ThrowStatement
	| ExpressionStatement
	| ReturnStatement
	| WhileStatement
	| BreakStatement
	| ContinueStatement
	| LabeledStatement
	| TryStatement
	| IfStatement
	| Comment
	| BlockStatement;
export type ModuleDeclaration = any;

export interface ConditionalExpression extends BaseNode {
	type: "ConditionalExpression";
	body: Expression;
	test: Expression;
	alternate: Expression;
}
export function conditionalExpression(
	test: Expression,
	body: Expression,
	alternate: Expression,
	start = 0,
	end = 0
): ConditionalExpression {
	return {
		type: "ConditionalExpression",
		test,
		body,
		alternate,
		end,
		start,
	};
}

export interface IfStatement extends BaseNode {
	type: "IfStatement";
	body: Statement;
	test: Expression | null;
	alternate: Statement | null;
}
export function ifStatement(
	test: Expression | null,
	body: Statement,
	alternate: Statement | null,
	start = 0,
	end = 0
): IfStatement {
	return {
		type: "IfStatement",
		body,
		test,
		alternate,
		start,
		end,
	};
}

export interface TryStatement extends BaseNode {
	type: "TryStatement";
	body: Statement;
	handler: CatchClause | null;
	finallyHandler: Statement | null;
}
export function tryStatement(
	body: Statement,
	handler: CatchClause | null,
	finallyHandler: Statement | null,
	start = 0,
	end = 0
): TryStatement {
	return {
		type: "TryStatement",
		body,
		handler,
		finallyHandler,
		end,
		start,
	};
}

export interface CatchClause extends BaseNode {
	type: "CatchClause";
	param: Expression | null;
	body: Statement;
}
export function catchClause(
	param: CatchClause["param"],
	body: Statement,
	start = 0,
	end = 0
): CatchClause {
	return {
		type: "CatchClause",
		param,
		body,
		end,
		start,
	};
}

export interface WhileStatement extends BaseNode {
	type: "WhileStatement";
	test: Expression;
	body: Statement;
}
export function whileStatement(
	test: Expression,
	body: Statement,
	start = 0,
	end = 0
): WhileStatement {
	return {
		type: "WhileStatement",
		test,
		body,
		end,
		start,
	};
}

export interface ContinueStatement extends BaseNode {
	type: "ContinueStatement";
	name: Identifier | null;
}
export function continueStatement(
	name: Identifier | null,
	start = 0,
	end = 0
): ContinueStatement {
	return {
		type: "ContinueStatement",
		name,
		end,
		start,
	};
}

export interface BreakStatement extends BaseNode {
	type: "BreakStatement";
	name: Expression | null;
}
export function breakStatement(
	name: Expression | null,
	start = 0,
	end = 0
): BreakStatement {
	return {
		type: "BreakStatement",
		name,
		end,
		start,
	};
}

export interface LabeledStatement extends BaseNode {
	type: "LabeledStatement";
	name: Identifier;
	body: Statement;
}
export function labeledStatement(
	name: Identifier,
	body: Statement,
	start = 0,
	end = 0
): LabeledStatement {
	return {
		type: "LabeledStatement",
		name,
		body,
		end,
		start,
	};
}

export interface ReturnStatement extends BaseNode {
	type: "ReturnStatement";
	value: Expression | null;
}
export function returnStatement(
	value: Expression | null,
	start = 0,
	end = 0
): ReturnStatement {
	return {
		type: "ReturnStatement",
		value,
		end,
		start,
	};
}

export interface BlockStatement extends BaseNode {
	type: "BlockStatement";
	body: Statement[];
}
export function blockStatement(
	body: Statement[],
	start = 0,
	end = 0
): BlockStatement {
	return {
		type: "BlockStatement",
		body,
		start,
		end,
	};
}

export interface DebuggerStatement extends BaseNode {
	type: "DebuggerStatement";
}
export function debuggerStatement(start = 0, end = 0): DebuggerStatement {
	return {
		type: "DebuggerStatement",
		end,
		start,
	};
}

export interface ThrowStatement extends BaseNode {
	type: "ThrowStatement";
	value: Expression;
}
export function throwStatement(
	value: Expression,
	start = 0,
	end = 0
): ThrowStatement {
	return {
		type: "ThrowStatement",
		end,
		start,
		value,
	};
}

export interface ExpressionStatement extends BaseNode {
	type: "ExpressionStatement";
	expression: Expression;
}
export function expressionStatement(
	expression: Expression,
	start = 0,
	end = 0
): ExpressionStatement {
	return {
		type: "ExpressionStatement",
		expression,
		end,
		start,
	};
}

export interface MemberExpression extends BaseNode {
	type: "MemberExpression";
	left: Expression;
	right: Expression;
	computed: boolean;
}
export function memberExpression(
	left: Expression,
	right: Expression,
	computed: boolean,
	start = 0,
	end = 0
): MemberExpression {
	return {
		type: "MemberExpression",
		computed,
		left,
		right,
		start,
		end,
	};
}

export interface UnaryExpression extends BaseNode {
	type: "UnaryExpression";
	operator: "+" | "-" | "~" | "!" | "void" | "delete" | "typeof";
	argument: Expression;
}
export function unaryExpression(
	operator: UnaryExpression["operator"],
	argument: Expression,
	start = 0,
	end = 0
): UnaryExpression {
	return {
		type: "UnaryExpression",
		operator,
		argument,
		start,
		end,
	};
}

export interface AssignmentExpression extends BaseNode {
	type: "AssignmentExpression";
	operator: "=";
	left: Expression;
	right: Expression;
}
export function assignmentExpression(
	left: Expression,
	right: Expression,
	start = 0,
	end = 0
): AssignmentExpression {
	return {
		type: "AssignmentExpression",
		left,
		end,
		operator: "=",
		right,
		start,
	};
}

export interface SequenceExpression extends BaseNode {
	type: "SequenceExpression";
	expressions: Expression[];
}
export function sequenceExpression(
	expressions: Expression[],
	start = 0,
	end = 0
): SequenceExpression {
	return {
		type: "SequenceExpression",
		expressions,
		end,
		start,
	};
}

export interface UpdateExpression extends BaseNode {
	type: "UpdateExpression";
	operator: "--" | "++";
	argument: Expression;
	prefix: boolean;
}
export function updateExpression(
	operator: UpdateExpression["operator"],
	argument: UpdateExpression["argument"],
	prefix: boolean,
	start = 0,
	end = 0
): UpdateExpression {
	return {
		type: "UpdateExpression",
		operator,
		argument,
		prefix,
		start,
		end,
	};
}

export interface Program extends BaseNode {
	type: "Program";
	sourceType: "module" | "script";
	hashbang: string | null;
	body: Array<Directive | Statement | ModuleDeclaration>;
}

export function program(
	sourceType: Program["sourceType"],
	body: Program["body"],
	start = 0,
	end = 0
): Program {
	return {
		type: "Program",
		sourceType,
		body,
		hashbang: null,
		start,
		end,
	};
}

export interface Identifier extends BaseNode {
	type: "Identifier";
	name: string;
}

export function identifier(name: string, start = 0, end = 0): Identifier {
	return {
		type: "Identifier",
		name,
		start,
		end,
	};
}

export interface ForStatement extends BaseNode {
	type: "ForStatement";
	init: Expression | VariableDeclaration | null;
	update: Expression | null;
	test: Expression | null;
	body: Statement;
}

export function forStatement(
	body: ForStatement["body"],
	init: ForStatement["init"],
	update: ForStatement["update"],
	test: ForStatement["test"],
	start = 0,
	end = 0
): ForStatement {
	return {
		type: "ForStatement",
		body,
		init,
		start,
		end,
		test,
		update,
	};
}

export interface ForInStatement extends BaseNode {
	type: "ForInStatement";
	left: Expression | VariableDeclaration;
	right: Expression;
	body: Statement;
}
export function forInStatement(
	left: ForInStatement["left"],
	right: ForInStatement["right"],
	body: ForInStatement["body"],
	start = 0,
	end = 0
): ForInStatement {
	return {
		type: "ForInStatement",
		left,
		right,
		body,
		start,
		end,
	};
}

export interface ForOfStatement extends BaseNode {
	type: "ForOfStatement";
	await: boolean;
	left: Expression | VariableDeclaration;
	right: Expression;
	body: Statement;
}

export function forOfStatement(
	left: ForOfStatement["left"],
	right: ForOfStatement["right"],
	body: ForOfStatement["body"],
	awaited: ForOfStatement["await"],
	start = 0,
	end = 0
): ForOfStatement {
	return {
		type: "ForOfStatement",
		await: awaited,
		left,
		right,
		body,
		start,
		end,
	};
}

export interface ObjectPattern extends BaseNode {
	type: "ObjectPattern";
	properties: Property[];
}

export function objectPattern(
	properties: ObjectPattern["properties"],
	start = 0,
	end = 0
): ObjectPattern {
	return {
		type: "ObjectPattern",
		properties,
		start,
		end,
	};
}

export interface ObjectExpression extends BaseNode {
	type: "ObjectExpression";
	properties: Property[];
}
export function objectExpression(
	properties: Property[],
	start = 0,
	end = 0
): ObjectExpression {
	return {
		type: "ObjectExpression",
		end,
		properties,
		start,
	};
}

export const enum PropertyKind {
	Normal,
	Get,
	Set,
	Spread,
}

export interface Property extends BaseNode {
	type: "Property";
	method: boolean;
	shorthand: boolean;
	computed: boolean;
	kind: "init" | "get" | "set";
	key: Expression;
	value: Expression;
}

export function property(
	key: Property["key"],
	value: Property["value"],
	computed: boolean,
	method: boolean,
	start = 0,
	end = 0
): Property {
	return {
		type: "Property",
		method,
		computed,
		shorthand: key === value,
		kind: "init",
		key,
		value,
		start,
		end,
	};
}

export interface ArrayPattern extends BaseNode {
	type: "ArrayPattern";
	elements: Array<Identifier | RestElement>;
}

export function arrayPattern(
	elements: ArrayPattern["elements"],
	start = 0,
	end = 0
): ArrayPattern {
	return {
		type: "ArrayPattern",
		elements,
		start,
		end,
	};
}

export interface RestElement extends BaseNode {
	type: "RestElement";
	argument: Identifier;
}

// TODO: Benchmark if it's faster to use a property on Bindings instead
export function restElement(
	argument: RestElement["argument"],
	start = 0,
	end = 0
): RestElement {
	return {
		type: "RestElement",
		argument,
		start,
		end,
	};
}

export interface ClassDeclaration extends BaseNode {
	type: "ClassDeclaration";
	name: Identifier | null;
	extend: Expression | null;
	properties: Property[];
}
export function classDeclaration(
	id: ClassDeclaration["name"],
	extend: ClassDeclaration["extend"],
	properties: ClassDeclaration["properties"],
	start = 0,
	end = 0
): ClassDeclaration {
	return {
		type: "ClassDeclaration",
		name: id,
		extend,
		properties,
		end,
		start,
	};
}
