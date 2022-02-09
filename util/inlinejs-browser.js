// This is the code that runs in the browser

const codeUrls = new Map();

for (const [id, code] of codeBlocks) {
	const re = importRegexp([...codeUrls.keys()]);
	let c = code.replace(re, (_, quote, asset) => `${quote}${codeUrls.get(asset)}${quote}`);
	const b = new Blob([c], { type: 'text/javascript' });
	const url = URL.createObjectURL(b);

	codeUrls.set(id, url);
}

// Import the main script to trigger execution
const e = document.createElement('script');
e.type = 'module';
e.textContent = `import '${codeUrls.get('main')}'`;
document.body.appendChild(e);

/**
 * Returns a regexp that matches all imports of the specified modules
 * at any path. The match contains a quote-character and the full import path
 * @param {string[]} imports
 * @returns RegExp
 */
function importRegexp(imports) {
	if (imports.length > 0) {
		return new RegExp(`(['"])[^'"]+(${imports.join('|')})['"]`, 'g');
	} else {
		// Regex that never matches
		return new RegExp(/^\b$/);
	}
}
