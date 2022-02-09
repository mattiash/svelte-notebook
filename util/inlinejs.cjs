/**
 * Inline svelte javascript code in html.
 *
 * Usage: node util/inlinejs.cjs build/index.html > index.inline.html
 *
 * Limitations:
 *
 * - must be run from the directory below build/
 * - only works for adapter-static
 * - assumes that all js filenames are unique and ignores their path
 * - only inlines javascript loaded with <link rel="modulepreload"...>
 * - does not inline error.svelte-xxx.js which results in an error on the console
 * - will probably break if svelte-kit or adapter-static changes its output
 *
 * Uses a technique described in https://stackoverflow.com/a/43834063 to be able
 * to use "import" on inlined javascript.
 */

const { readFileSync } = require('fs');
const { basename } = require('path');

let id = 0;

const js = new Map();

const file = process.argv[2];

let html = readFileSync(file).toString();

html = html.replace(/<link rel="modulepreload" href="(.*?.js)"\s*>/g, (_, path) => processJs(path));

const jsidReplace = new RegExp(`(['"])[^'"]+(` + [...js.keys()].join('|') + ')', 'g');

const order = calculateImportOrder();

const mainCode = getMainJs(html);
js.set('main', mainCode);
order.push('main');
const result = [];
for (const id of order) {
	result.push([id, js.get(id)]);
}

const newJs =
	` const codeBlocks = ${JSON.stringify(result)}\n` +
	readFileSync(__dirname + '/inlinejs-browser.js');

console.log(replaceMainJs(html, newJs));

function processJs(path) {
	const name = basename(path);
	js.set(name, readJsFile(path));
	id = id + 1;
	return '';
}

function readJsFile(path) {
	return readFileSync('build' + path).toString();
}

/**
 * Returns a regexp that matches all imports of the specified modules
 * at any path. The match contains a quote-character and the full import path
 * @param {string[]} imports
 * @returns RegExp
 */
function importRegexp(imports) {
	return new RegExp(`(['"])[^'"]+(${imports.join('|')})['"]`, 'g');
}

function calculateImportOrder() {
	const order = [];
	const unprocessedModules = new Set(js.keys());
	let found = false;
	do {
		found = false;
		const re = importRegexp([...unprocessedModules.keys()]);
		for (const [id, code] of js.entries()) {
			if (unprocessedModules.has(id)) {
				if (!code.match(re)) {
					found = true;
					order.push(id);
					unprocessedModules.delete(id);
				}
			}
		}
	} while (found);

	return order;
}

function getMainJs(html) {
	const m = html.match(/<script type="module".*?>([\s\S]+?)<\/script>/);
	return m[1];
}

function replaceMainJs(html, newJs) {
	return html.replace(/(<script type="module".*?>)([\s\S]+?)(<\/script>)/, `$1${newJs}$3`);
}
