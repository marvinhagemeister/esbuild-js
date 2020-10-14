console.log(`Don't forget to run "yarn build" first to generate dist files`);
console.log();

const fs = require("fs");
const path = require("path");
const parser = process.env.DEBUG
	? require("../src/index")
	: require("../dist/cjs/index");

const code = fs.readFileSync(path.join(__dirname, "preact.js"), "utf-8");

const ast = parser.parse(code);
// console.log(JSON.stringify(ast, null, 2));
const str = parser.serialize(ast);

fs.writeFileSync(path.join(__dirname, "tmp.js"), str);
