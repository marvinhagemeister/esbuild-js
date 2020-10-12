import * as t from "estree";

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence
export const enum Precedence {
	Lowest,
	/** , */
	Comma,
	/** yield */
	Yield,
	/** = */
	Assignment,
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
	len: number;
}

export type AstNode =
	| Directive
	| Identifier
	| Program
	| VariableDeclarator
	| t.ImportDeclaration
	| Statement
	| Pattern
	| Property
	| Expression;

export type Expression =
	| Literal
	| Identifier
	| ArrayExpression
	| FunctionDeclaration
	| SequenceExpression
	| UpdateExpression
	| BinaryExpression
	| UnaryExpression
	| ClassDeclaration
	| ObjectExpression
	| EmptyExpression;

export interface EmptyExpression extends BaseNode {
	type: "EmptyExpression";
}

export function emptyExpression(): EmptyExpression {
	return {
		type: "EmptyExpression",
		start: 0,
		len: 0,
	};
}

export interface EmptyStatement extends BaseNode {
	type: "EmptyStatement";
	text: string;
}

export function emptyStatement(text: string): EmptyStatement {
	return {
		type: "EmptyStatement",
		text,
		start: 0,
		len: 0,
	};
}

export interface Literal extends BaseNode {
	type: "Literal";
	value: string | number | boolean | null | undefined;
	raw: string;
}

export function literal(value: Literal["value"]): Literal {
	return {
		type: "Literal",
		value,
		raw: "" + value,
		start: 0,
		len: 0,
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
		len: 0,
	};
}

export interface BinaryExpression extends BaseNode {
	type: "BinaryExpression";
	left: Expression;
	operator:
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
		| "&&";
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
		len: 0,
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
		len: 0,
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
		len: 0,
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
		len: 0,
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
	| EmptyStatement
	| ExpressionStatement
	| BlockStatement;
export type ModuleDeclaration = t.ImportDeclaration;

export interface BlockStatement extends BaseNode {
	type: "BlockStatement";
	body: Statement[];
}
export function blockStatement(body: Statement[]): BlockStatement {
	return {
		type: "BlockStatement",
		body,
		start: 0,
		len: 0,
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
		len: 0,
		start: 0,
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
		len: 0,
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
		len: 0,
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
		len: 0,
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
		len: 0,
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
		len: 0,
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
		len: 0,
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
		len: 0,
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
		len: 0,
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
		len: 0,
	};
}

export interface ObjectExpression extends BaseNode {
	type: "ObjectExpression";
	properties: Property[];
}
export function objectExpression(properties: Property[]): ObjectExpression {
	return {
		type: "ObjectExpression",
		len: 0,
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
		kind: "init",
		key,
		value,
		start: 0,
		len: 0,
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
		len: 0,
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
		len: 0,
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
		len: 0,
		start: 0,
	};
}
