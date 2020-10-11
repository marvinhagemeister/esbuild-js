import { Node } from "estree";
import { AstNode } from "./ast";

export interface SerializeOptions {
	indentChar?: string;
	newLineChar?: string;
}

export function serialize(node: AstNode, options: SerializeOptions = {}) {
	return serializeAst(node, null, {
		indentChar: options.indentChar || "  ",
		newLineChar: options.newLineChar || "\n",
	});
}

function serializeAst(
	node: AstNode,
	parent: AstNode | null,
	options: Required<SerializeOptions>
): string {
	const { indentChar, newLineChar } = options;
	let out = "";

	switch (node.type) {
		case "Identifier":
			out += node.name;
			break;
		case "Literal":
			out += node.raw;
			break;
		case "ObjectPattern": {
			out += "{";
			for (let i = 0; i < node.properties.length; i++) {
				out += serializeAst(node.properties[i], node, options);
				if (i + 1 < node.properties.length) {
					out += ", ";
				}
			}
			out += "}";
			break;
		}
		case "ObjectProperty": {
			break;
		}
		case "VariableDeclaration": {
			out += node.kind + " ";
			for (let i = 0; i < node.declarations.length; i++) {
				out += serializeAst(node.declarations[i], node, options);
				if (i + 1 < node.declarations.length) {
					out += ", ";
				}
				if (
					!parent ||
					(parent.type !== "ForInStatement" &&
						parent.type !== "ForOfStatement" &&
						parent.type !== "ForStatement")
				) {
					out += ";";
					if (newLineChar) {
						out += newLineChar;
					}
				}
			}
			break;
		}
		case "VariableDeclarator": {
			out += serializeAst(node.id, node, options);
			if (node.init) {
				out += " = " + serializeAst(node.init, node, options);
			}
			break;
		}
		case "ArrayExpression": {
			out += "[";
			for (let i = 0; i < node.elements.length; i++) {
				out += serializeAst(node.elements[i], node, options);
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
			out += "{";
			if (options.newLineChar) {
				out += options.newLineChar;
			}

			for (let i = 0; i < node.body.length; i++) {
				out += serializeAst(node.body[i], node.body[i], options);
			}
			out += "}";
			if (options.newLineChar) {
				out += options.newLineChar;
			}
			return out;
		}
		case "FunctionDeclaration": {
			if (node.async) {
				out += "async ";
			}
			out += "function";
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
				out += serializeAst(node.params[i], node, options);
				if (i + 1 < node.params.length) {
					out += ",";
				}
			}

			out += ")";
			if (options.indentChar) {
				out += " ";
			}
			out += serializeAst(node.body, node, options);
			return out;
		}
		case "ForStatement": {
			out += "for (";
			if (node.init) out += serializeAst(node.init, node, options);
			out += ";";
			if (node.test) out += serializeAst(node.test, node, options);
			out += ";";
			if (node.update) out += serializeAst(node.update, node, options);
			out += ")";
			out += serializeAst(node.body, node, options);
			return out;
		}
		case "ForInStatement": {
			return (
				"for (" +
				serializeAst(node.left, node, options) +
				" in " +
				serializeAst(node.right, node, options) +
				")" +
				serializeAst(node.body, node, options)
			);
		}
		case "ForOfStatement": {
			return (
				"for (" +
				serializeAst(node.left, node, options) +
				" of " +
				serializeAst(node.right, node, options) +
				")" +
				serializeAst(node.body, node, options)
			);
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
		case "Program": {
			if (node.hashbang) {
				out += node.hashbang + "\n";
			}
			for (let i = 0; i < node.body.length; i++) {
				out += serializeAst(node.body[i], node, options);
			}

			return out;
		}

		default:
			console.log(node);
			throw new Error(`No serializer found`);
	}

	return out;
}
