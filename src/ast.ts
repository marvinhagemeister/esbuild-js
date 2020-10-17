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

export function emptyExpression(): EmptyExpression {
	return {
		type: "EmptyExpression",
		start: 0,
		end: 0,
	};
}

export interface EmptyStatement extends BaseNode {
	type: "EmptyStatement";
}

export function emptyStatement(): EmptyStatement {
	return {
		type: "EmptyStatement",
		start: 0,
		end: 0,
	};
}

export interface Literal extends BaseNode {
	type: "Literal";

	value: string | number | boolean | null | undefined;
	raw: string;
}
export function literal(value: Literal["value"], raw: string): Literal {
	return {
		type: "Literal",
		value,
		raw,
		start: 0,
		end: 0,
	};
}

export interface RegExpLiteral extends BaseNode {
	type: "RegExpLiteral";
	value: string;
}
export function regexpLiteral(value: string): RegExpLiteral {
	return {
		type: "RegExpLiteral",
		value,
		end: 0,
		start: 0,
	};
}

export interface Comment extends BaseNode {
	type: "Comment";
	text: string;
}
export function comment(text: string): Comment {
	return {
		type: "Comment",
		text,
		start: 0,
		end: 0,
	};
}

export interface ArrayExpression extends BaseNode {
	type: "ArrayExpression";
	elements: Expression[];
}
export function arrayExpression(
	elements: ArrayExpression["elements"]
): ArrayExpression {
	return {
		type: "ArrayExpression",
		elements,
		start: 0,
		end: 0,
	};
}

export interface CallExpression extends BaseNode {
	type: "CallExpression";
	callee: Expression;
	arguments: Expression[];
}
export function callExpression(
	callee: Expression,
	callArguments: Expression[]
): CallExpression {
	return {
		type: "CallExpression",
		callee,
		arguments: callArguments,
		end: 0,
		start: 0,
	};
}

export interface NewExpression extends BaseNode {
	type: "NewExpression";
	callee: Expression;
	arguments: Expression[];
}
export function newExpression(
	callee: Expression,
	callArguments: Expression[]
): NewExpression {
	return {
		type: "NewExpression",
		callee,
		arguments: callArguments,
		end: 0,
		start: 0,
	};
}

export interface ThisExpression extends BaseNode {
	type: "ThisExpression";
}
export function thisExpression(): ThisExpression {
	return {
		type: "ThisExpression",
		end: 0,
		start: 0,
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
	right: Expression
): BinaryExpression {
	return {
		type: "BinaryExpression",
		left,
		right,
		operator,
		start: 0,
		end: 0,
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
	async: boolean
): FunctionDeclaration {
	return {
		type: "FunctionDeclaration",
		name,
		generator,
		params,
		body,
		async,
		start: 0,
		end: 0,
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
	init: VariableDeclarator["init"]
): VariableDeclarator {
	return {
		type: "VariableDeclarator",
		id,
		init,
		start: 0,
		end: 0,
	};
}

export interface VariableDeclaration extends BaseNode {
	type: "VariableDeclaration";
	kind: "var" | "let" | "const";
	declarations: VariableDeclarator[];
}

export function variableDeclaration(
	kind: VariableDeclaration["kind"],
	declarations: VariableDeclaration["declarations"]
): VariableDeclaration {
	return {
		type: "VariableDeclaration",
		kind,
		declarations,
		start: 0,
		end: 0,
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
	alternate: Expression
): ConditionalExpression {
	return {
		type: "ConditionalExpression",
		test,
		body,
		alternate,
		end: 0,
		start: 0,
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
	alternate: Statement | null
): IfStatement {
	return {
		type: "IfStatement",
		body,
		test,
		alternate,
		start: 0,
		end: 0,
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
	finallyHandler: Statement | null
): TryStatement {
	return {
		type: "TryStatement",
		body,
		handler,
		finallyHandler,
		end: 0,
		start: 0,
	};
}

export interface CatchClause extends BaseNode {
	type: "CatchClause";
	param: Expression | null;
	body: Statement;
}
export function catchClause(
	param: CatchClause["param"],
	body: Statement
): CatchClause {
	return {
		type: "CatchClause",
		param,
		body,
		end: 0,
		start: 0,
	};
}

export interface WhileStatement extends BaseNode {
	type: "WhileStatement";
	test: Expression;
	body: Statement;
}
export function whileStatement(
	test: Expression,
	body: Statement
): WhileStatement {
	return {
		type: "WhileStatement",
		test,
		body,
		end: 0,
		start: 0,
	};
}

export interface ContinueStatement extends BaseNode {
	type: "ContinueStatement";
	name: Identifier | null;
}
export function continueStatement(name: Identifier | null): ContinueStatement {
	return {
		type: "ContinueStatement",
		name,
		end: 0,
		start: 0,
	};
}

export interface BreakStatement extends BaseNode {
	type: "BreakStatement";
	name: Expression | null;
}
export function breakStatement(name: Expression | null): BreakStatement {
	return {
		type: "BreakStatement",
		name,
		end: 0,
		start: 0,
	};
}

export interface LabeledStatement extends BaseNode {
	type: "LabeledStatement";
	name: Identifier;
	body: Statement;
}
export function labeledStatement(
	name: Identifier,
	body: Statement
): LabeledStatement {
	return {
		type: "LabeledStatement",
		name,
		body,
		end: 0,
		start: 0,
	};
}

export interface ReturnStatement extends BaseNode {
	type: "ReturnStatement";
	value: Expression | null;
}
export function returnStatement(value: Expression | null): ReturnStatement {
	return {
		type: "ReturnStatement",
		value,
		end: 0,
		start: 0,
	};
}

export interface BlockStatement extends BaseNode {
	type: "BlockStatement";
	body: Statement[];
}
export function blockStatement(body: Statement[]): BlockStatement {
	return {
		type: "BlockStatement",
		body,
		start: 0,
		end: 0,
	};
}

export interface DebuggerStatement extends BaseNode {
	type: "DebuggerStatement";
}
export function debuggerStatement(): DebuggerStatement {
	return {
		type: "DebuggerStatement",
		end: 0,
		start: 0,
	};
}

export interface ThrowStatement extends BaseNode {
	type: "ThrowStatement";
	value: Expression;
}
export function throwStatement(value: Expression): ThrowStatement {
	return {
		type: "ThrowStatement",
		end: 0,
		start: 0,
		value,
	};
}

export interface ExpressionStatement extends BaseNode {
	type: "ExpressionStatement";
	expression: Expression;
}
export function expressionStatement(
	expression: Expression
): ExpressionStatement {
	return {
		type: "ExpressionStatement",
		expression,
		end: 0,
		start: 0,
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
	computed: boolean
): MemberExpression {
	return {
		type: "MemberExpression",
		computed,
		left,
		right,
		start: 0,
		end: 0,
	};
}

export interface UnaryExpression extends BaseNode {
	type: "UnaryExpression";
	operator: "+" | "-" | "~" | "!" | "void" | "delete" | "typeof";
	argument: Expression;
}
export function unaryExpression(
	operator: UnaryExpression["operator"],
	argument: Expression
): UnaryExpression {
	return {
		type: "UnaryExpression",
		operator,
		argument,
		start: 0,
		end: 0,
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
	right: Expression
): AssignmentExpression {
	return {
		type: "AssignmentExpression",
		left,
		end: 0,
		operator: "=",
		right,
		start: 0,
	};
}

export interface SequenceExpression extends BaseNode {
	type: "SequenceExpression";
	expressions: Expression[];
}
export function sequenceExpression(
	expressions: Expression[]
): SequenceExpression {
	return {
		type: "SequenceExpression",
		expressions,
		end: 0,
		start: 0,
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
	prefix: boolean
): UpdateExpression {
	return {
		type: "UpdateExpression",
		operator,
		argument,
		prefix,
		start: 0,
		end: 0,
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
	body: Program["body"]
): Program {
	return {
		type: "Program",
		sourceType,
		body,
		hashbang: null,
		start: 0,
		end: 0,
	};
}

export interface Identifier extends BaseNode {
	type: "Identifier";
	name: string;
}

export function identifier(name: string): Identifier {
	return {
		type: "Identifier",
		name,
		start: 0,
		end: 0,
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
	test: ForStatement["test"]
): ForStatement {
	return {
		type: "ForStatement",
		body,
		init,
		start: 0,
		end: 0,
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
	body: ForInStatement["body"]
): ForInStatement {
	return {
		type: "ForInStatement",
		left,
		right,
		body,
		start: 0,
		end: 0,
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
	awaited: ForOfStatement["await"]
): ForOfStatement {
	return {
		type: "ForOfStatement",
		await: awaited,
		left,
		right,
		body,
		start: 0,
		end: 0,
	};
}

export interface ObjectPattern extends BaseNode {
	type: "ObjectPattern";
	properties: Property[];
}

export function objectPattern(
	properties: ObjectPattern["properties"]
): ObjectPattern {
	return {
		type: "ObjectPattern",
		properties,
		start: 0,
		end: 0,
	};
}

export interface ObjectExpression extends BaseNode {
	type: "ObjectExpression";
	properties: Property[];
}
export function objectExpression(properties: Property[]): ObjectExpression {
	return {
		type: "ObjectExpression",
		end: 0,
		properties,
		start: 0,
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
	method: boolean
): Property {
	return {
		type: "Property",
		method,
		computed,
		shorthand: key === value,
		kind: "init",
		key,
		value,
		start: 0,
		end: 0,
	};
}

export interface ArrayPattern extends BaseNode {
	type: "ArrayPattern";
	elements: Array<Identifier | RestElement>;
}

export function arrayPattern(elements: ArrayPattern["elements"]): ArrayPattern {
	return {
		type: "ArrayPattern",
		elements,
		start: 0,
		end: 0,
	};
}

export interface RestElement extends BaseNode {
	type: "RestElement";
	argument: Identifier;
}

// TODO: Benchmark if it's faster to use a property on Bindings instead
export function restElement(argument: RestElement["argument"]): RestElement {
	return {
		type: "RestElement",
		argument,
		start: 0,
		end: 0,
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
	properties: ClassDeclaration["properties"]
): ClassDeclaration {
	return {
		type: "ClassDeclaration",
		name: id,
		extend,
		properties,
		end: 0,
		start: 0,
	};
}
