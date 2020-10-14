import { AstNode } from "./ast";

export interface SerializeOptions {
	indentChar?: string;
	newLineChar?: string;
}

export function serialize(node: AstNode, options: SerializeOptions = {}) {
	const indentChar = "indentChar" in options ? options.indentChar || "" : "  ";
	const newLineChar =
		"newLineChar" in options ? options.newLineChar || "" : "\n";

	// TODO: Hoist this?
	const indentCache: string[] = [""];
	const indent = (n: number) => {
		if (n >= indentCache.length || indentCache[n] === undefined) {
			indentCache[n] = indentChar.repeat(n);
		}
		return indentCache[n];
	};

	return serializeAst(node, null, 0, false, false, {
		indentChar,
		indent,
		newLineChar,
	});
}

export interface InternalSerialize extends Required<SerializeOptions> {
	indent: (level: number) => string;
}

function serializeAst(
	node: AstNode,
	parent: AstNode | null,
	level: number,
	skipIndent: boolean,
	isExpression: boolean,
	options: InternalSerialize
): string {
	let out = "";

	switch (node.type) {
		case "Identifier":
			return node.name;
		case "Literal":
			// TODO: Quotes
			if (typeof node.value === "string") {
				return '"' + node.raw + '"';
			}
			return node.raw;
		case "ObjectPattern": {
			out += "{";
			for (let i = 0; i < node.properties.length; i++) {
				out += serializeAst(
					node.properties[i],
					node,
					level,
					skipIndent,
					isExpression,
					options
				);
				if (i + 1 < node.properties.length) {
					out += ", ";
				}
			}
			out += "}";
			return out;
		}
		case "ObjectExpression": {
			out += "{";
			if (node.properties.length > 1) {
				out += options.newLineChar;
			}

			for (let i = 0; i < node.properties.length; i++) {
				out += serializeAst(
					node.properties[i],
					node,
					level + 1,
					skipIndent,
					isExpression,
					options
				);
				if (i + 1 < node.properties.length) {
					out += "," + options.newLineChar;
				}
			}
			out += "}";
			return out;
		}
		case "Property": {
			out += options.indent(level);
			if (node.shorthand) {
				out += serializeAst(
					node.key,
					node,
					level + 1,
					skipIndent,
					isExpression,
					options
				);
				return out;
			}

			if (node.computed) {
				out += "[";
			} else if (!skipIndent) {
				out += options.indent(level);
			}
			out += serializeAst(node.key, node, level, skipIndent, true, options);
			if (node.computed) {
				out += "]";
			}
			if (!node.method) {
				out += ": ";
			}
			out += serializeAst(
				node.value,
				node,
				level,
				skipIndent,
				isExpression,
				options
			);
			return out;
		}
		case "ClassDeclaration":
			{
				out += "class ";
				if (node.name) {
					out += node.name.name + " ";
				}
				if (node.extend) {
					out +=
						serializeAst(
							node.extend,
							node,
							level,
							skipIndent,
							isExpression,
							options
						) + " ";
				}
			}
			out += "{" + options.newLineChar;
			for (let i = 0; i < node.properties.length; i++) {
				out += serializeAst(
					node.properties[i],
					node,
					level + 1,
					skipIndent,
					isExpression,
					options
				);
			}
			out += "}" + options.newLineChar;
			return out;
		case "VariableDeclaration": {
			if (!skipIndent) {
				out += options.indent(level);
			}
			out += node.kind + " ";
			for (let i = 0; i < node.declarations.length; i++) {
				out += serializeAst(
					node.declarations[i],
					node,
					level,
					skipIndent,
					isExpression,
					options
				);
				if (i + 1 < node.declarations.length) {
					out += ", ";
				}
			}
			if (!isExpression) {
				out += ";" + options.newLineChar;
			}
			return out;
		}
		case "VariableDeclarator": {
			out += serializeAst(
				node.id,
				node,
				level,
				skipIndent,
				isExpression,
				options
			);
			if (node.init) {
				out += " = ";
				out += serializeAst(
					node.init,
					node,
					level,
					true,
					isExpression,
					options
				);
			}
			return out;
		}
		case "ArrayExpression": {
			out += "[";
			for (let i = 0; i < node.elements.length; i++) {
				out += serializeAst(
					node.elements[i],
					node,
					level,
					skipIndent,
					isExpression,
					options
				);
				if (
					i + 1 < node.elements.length ||
					node.elements[i].type === "EmptyExpression"
				) {
					out += ",";
				}
			}
			out += "]";
			if (!parent || parent.type === "Program") {
				out += ";\n";
			}
			return out;
		}
		case "BlockStatement": {
			out += "{" + options.newLineChar;

			for (let i = 0; i < node.body.length; i++) {
				out += serializeAst(
					node.body[i],
					node,
					level + 1,
					skipIndent,
					isExpression,
					options
				);
			}
			if (!skipIndent) {
				out += options.indent(level);
			}
			out += "}";
			if (!skipIndent && options.newLineChar) {
				out += options.newLineChar;
			}
			return out;
		}
		case "IfStatement": {
			if (!skipIndent) {
				out += options.indent(level);
			}
			if (node.test !== null) {
				out +=
					"if (" +
					serializeAst(node.test, node, level, true, isExpression, options) +
					") ";
			}

			if (node.body.type === "ExpressionStatement") {
				out += serializeAst(
					node.body,
					node,
					level,
					true,
					isExpression,
					options
				);
			} else {
				const localSkipIndent = node.body.type !== "BlockStatement";
				out += serializeAst(
					node.body,
					node,
					level,
					localSkipIndent,
					isExpression,
					options
				);
			}

			if (node.alternate) {
				out += options.indent(level);
				out += "else ";
				out += serializeAst(
					node.alternate,
					node,
					level,
					false,
					isExpression,
					options
				);

				if (node.alternate.type !== "IfStatement") {
					out += options.newLineChar;
				}
			} else if (node.body.type === "BlockStatement") {
				out += options.newLineChar;
			}

			return out;
		}
		case "FunctionDeclaration": {
			if (node.async) {
				out += "async ";
			}
			if (!parent || parent.type !== "Property" || !parent.method) {
				out += "function";
			}
			if (node.generator) {
				out += "* ";
			}

			if (!node.generator && node.name) {
				out += " ";
			}
			if (node.name) {
				out += node.name;
			}
			out += "(";
			for (let i = 0; i < node.params.length; i++) {
				out += serializeAst(
					node.params[i],
					node,
					level,
					skipIndent,
					isExpression,
					options
				);
				if (i + 1 < node.params.length) {
					out += ", ";
				}
			}

			out += ") ";
			out += serializeAst(
				node.body,
				node,
				level,
				skipIndent,
				parent !== null && parent.type === "VariableDeclarator",
				options
			);
			if (!isExpression) {
				out += options.newLineChar;
			}
			return out;
		}
		case "TryStatement": {
			let localIndent = !skipIndent ? options.indent(level) : "";
			out += localIndent;
			out += "try ";
			out += serializeAst(node.body, node, level, false, isExpression, options);
			if (node.handler) {
				out += localIndent;
				out += "catch";
				if (node.handler.param) {
					out += " (";
					out += serializeAst(
						node.handler.param,
						node.handler,
						level + 1,
						false,
						isExpression,
						options
					);
					out += ") ";
				}

				out += serializeAst(
					node.handler.body,
					node,
					level,
					false,
					isExpression,
					options
				);
				if (!node.finallyHandler) {
					out += "\n";
				}
			}

			if (node.finallyHandler) {
				out += localIndent;
				out += "finally ";
				out += serializeAst(
					node.finallyHandler,
					node,
					level,
					false,
					isExpression,
					options
				);
				out += "\n";
			}

			return out;
		}
		case "WhileStatement": {
			out += "while (";
			out += serializeAst(node.test, node, level, true, isExpression, options);
			out += ") ";
			out += serializeAst(
				node.body,
				node,
				level,
				skipIndent,
				isExpression,
				options
			);
			return out;
		}
		case "ForStatement": {
			if (!skipIndent) {
				out += options.indent(level);
			}
			out += "for (";
			if (node.init)
				out += serializeAst(node.init, node, level, true, true, options);
			out += "; ";
			if (node.test)
				out += serializeAst(node.test, node, level, true, true, options);
			out += "; ";
			if (node.update)
				out += serializeAst(
					node.update,
					node,
					level,
					skipIndent,
					true,
					options
				);
			out += ")";
			out += serializeAst(
				node.body,
				node,
				level,
				skipIndent,
				isExpression,
				options
			);
			return out;
		}
		case "ForInStatement": {
			if (!skipIndent) {
				out += options.indent(level);
			}

			out += "for (";
			out += serializeAst(node.left, node, 0, true, true, options);
			out += " in ";
			out += serializeAst(node.right, node, 0, true, true, options);
			out += ") ";
			out += serializeAst(
				node.body,
				node,
				level,
				skipIndent,
				isExpression,
				options
			);
			return out;
		}
		case "ForOfStatement": {
			if (!skipIndent) {
				out += options.indent(level);
			}

			out += "for (";
			out += serializeAst(node.left, node, 0, true, true, options);
			out += " of ";
			out += serializeAst(node.right, node, 0, true, true, options);
			out += ")";
			out += serializeAst(
				node.body,
				node,
				level,
				skipIndent,
				isExpression,
				options
			);
			return out;
		}
		case "ExpressionStatement": {
			out += serializeAst(
				node.expression,
				node,
				level,
				skipIndent,
				isExpression,
				options
			);

			if (
				parent &&
				parent.type !== "ForStatement" &&
				parent.type !== "ForInStatement" &&
				parent.type !== "ForOfStatement" &&
				parent.type !== "IfStatement" &&
				node.expression.type !== "ClassDeclaration"
			) {
				out += ";\n";
			}
			return out;
		}
		case "ReturnStatement": {
			out += options.indent(level) + "return";
			if (node.value) {
				out +=
					" " +
					serializeAst(node.value, node, level, true, isExpression, options);
			}
			out += ";\n";
			return out;
		}
		case "CallExpression": {
			if (!skipIndent) {
				out += options.indent(level);
			}
			out += serializeAst(
				node.callee,
				node,
				level,
				true,
				isExpression,
				options
			);
			out += "(";
			const args = node.arguments;
			for (let i = 0; i < args.length; i++) {
				out += serializeAst(args[i], node, level, true, isExpression, options);
				if (i + 1 < args.length) {
					out += ", ";
				}
			}
			out += ")";
			return out;
		}
		case "ConditionalExpression": {
			out += serializeAst(node.test, node, level, false, false, options);
			out += options.newLineChar;
			out += options.indent(level + 1) + "? ";
			out += serializeAst(node.body, node, level, false, false, options);
			out += options.newLineChar;
			out += options.indent(level + 1) + ": ";
			out += serializeAst(
				node.alternate,
				node,
				level + 1,
				false,
				false,
				options
			);
			return out;
		}
		case "ThisExpression": {
			return "this";
		}
		case "NewExpression": {
			out += "new ";
			out += serializeAst(
				node.callee,
				node,
				level,
				true,
				isExpression,
				options
			);
			out += "(";
			const args = node.arguments;
			for (let i = 0; i < args.length; i++) {
				out += serializeAst(args[i], node, level, true, isExpression, options);
				if (i + 1 < args.length) {
					out += ", ";
				}
			}
			out += ")";
			return out;
		}
		case "UpdateExpression":
			if (node.prefix) {
				out += node.operator;
			}
			out += serializeAst(
				node.argument,
				node,
				0,
				skipIndent,
				isExpression,
				options
			);
			if (!node.prefix) {
				out += node.operator;
			}
			return out;
		case "SequenceExpression":
			const len = node.expressions.length;
			if (len === 1) {
				const expr = node.expressions[0];
				if (
					expr.type === "UnaryExpression" &&
					expr.operator === "+" &&
					expr.argument.type === "Literal"
				) {
					return serializeAst(expr, node, 0, true, isExpression, options);
				}
			}

			out += "(";
			for (let i = 0; i < len; i++) {
				out += serializeAst(
					node.expressions[i],
					node,
					0,
					true,
					isExpression,
					options
				);
				if (i + 1 < len) {
					out += ", ";
				}
			}
			out += ")";
			return out;
		case "UnaryExpression": {
			if (node.operator !== "+" || node.argument.type !== "Literal") {
				out += node.operator;
				// Operators: void, delete, typeof
				if (node.operator.length > 1) {
					out += " ";
				}
			}

			out += serializeAst(
				node.argument,
				node,
				0,
				skipIndent,
				isExpression,
				options
			);
			return out;
		}
		case "BinaryExpression": {
			return (
				serializeAst(node.left, node, 0, skipIndent, isExpression, options) +
				" " +
				node.operator +
				" " +
				serializeAst(node.right, node, 0, skipIndent, isExpression, options)
			);
		}
		case "MemberExpression": {
			if (!skipIndent) {
				out += options.indent(level);
			}
			out += serializeAst(
				node.left,
				node,
				level,
				skipIndent,
				isExpression,
				options
			);
			out += node.computed ? "[" : ".";
			out += serializeAst(
				node.right,
				node,
				level,
				skipIndent,
				isExpression,
				options
			);
			if (node.computed) {
				out += "]";
			}
			return out;
		}
		case "AssignmentExpression": {
			if (!skipIndent) {
				out += options.indent(level);
			}
			out += serializeAst(node.left, node, level, true, isExpression, options);
			out += " = ";
			out += serializeAst(node.right, node, level, true, isExpression, options);
			return out;
		}
		case "RegExpLiteral": {
			return node.value;
		}
		case "ThrowStatement": {
			if (!skipIndent) {
				out += options.indent(level);
			}
			out += "throw ";
			out += serializeAst(node.value, node, level, true, isExpression, options);
			return out + ";\n";
		}
		case "BreakStatement": {
			if (!skipIndent) {
				out += options.indent(level);
			}
			out += "break";
			if (node.name) {
				out +=
					" " +
					serializeAst(node.name, node, level, true, isExpression, options);
			}
			return (out += ";\n");
		}
		case "ContinueStatement": {
			if (!skipIndent) {
				out += options.indent(level);
			}
			out += "continue";
			if (node.name) {
				out +=
					" " +
					serializeAst(node.name, node, level, true, isExpression, options);
			}
			return (out += ";\n");
		}
		case "LabeledStatement": {
			out += options.indent(level);
			out += serializeAst(node.name, node, level, true, isExpression, options);
			out += ":\n";
			out +=
				options.indent(level + 1) +
				serializeAst(node.body, node, level + 1, false, isExpression, options);
			return out;
		}
		case "EmptyStatement": {
			out += ";";
			if (options.newLineChar) {
				out += options.newLineChar;
			}
			return out;
		}
		case "EmptyExpression": {
			return "";
		}
		case "Comment":
			return options.indent(level) + node.text + options.newLineChar;
		case "DebuggerStatement":
			return "debugger;\n";
		case "Program": {
			if (node.hashbang) {
				out += node.hashbang + "\n";
			}
			for (let i = 0; i < node.body.length; i++) {
				out += serializeAst(
					node.body[i],
					node,
					0,
					skipIndent,
					isExpression,
					options
				);
			}

			return out;
		}

		default:
			console.log(node);
			throw new Error(`No serializer found`);
	}
}
