import { Node } from "estree";

export function serializeAST(node: Node): string {
	let out = "";

	switch (node.type) {
		case "Identifier":
			out += node.name;
			break;
		case "ObjectPattern": {
			out += "{";
			for (let i = 0; i < node.properties.length; i++) {
				out += serializeAST(node.properties[i]);
				if (i + 1 < node.properties.length) {
					out += ", ";
				}
			}
			out += "}";
			break;
		}
		case "Property": {
			break;
		}
		case "VariableDeclaration": {
			out += node.kind + " ";
			for (let i = 0; i < node.declarations.length; i++) {
				out += serializeAST(node.declarations[i]);
				if (i + 1 < node.declarations.length) {
					out += ", ";
				}
				out += ";";
			}
			break;
		}
		case "VariableDeclarator": {
			out += serializeAST(node.id);
			if (node.init) {
				out += " = " + serializeAST(node.init);
			}
			break;
		}

		default:
			console.log(node);
			throw new Error(`No serializer for ${node.type} found`);
	}

	return out;
}
