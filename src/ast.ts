import * as t from "estree";

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
	| ObjectProperty
	| Expression;

export type Expression = Literal | Identifier;

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
	| EmptyStatement;
export type ModuleDeclaration = t.ImportDeclaration;

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
	properties: ObjectProperty[];
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

export interface ObjectProperty extends BaseNode {
	type: "ObjectProperty";
	method: boolean;
	shorthand: boolean;
	kind: "init" | "get" | "set";
	key: any;
	value: any;
}

export function property(key: Identifier, value: Identifier): ObjectProperty {
	return {
		type: "ObjectProperty",
		method: false,
		shorthand: key === value,
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
