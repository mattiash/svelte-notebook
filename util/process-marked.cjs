const { marked } = require('marked');
const { readFileSync, existsSync } = require('fs');
const { resolve, dirname } = require('path');

const globalCode = `
function format(num) {
	return num.toLocaleString()
}
`;

let allRunCode = globalCode;
let dependencies = [];

let currentBasename = '';
let currentDir = '';
let projectRoot = '';

function processCode(code, interactive) {
	const runCode = code
		// Replace ranges with default value
		.replace(/\d+:(\d+):\d+(:\d+){0,1}/g, '$1');

	const displayCode = code
		.replace(/\$: /g, 'let ')
		.replace(/{/g, '&#123;')
		.replace(/}/g, '&#125;')
		.replace(
			// Display value after assignment with non-numeric value
			/^(const|let)\s*(\S+)(\s*=.*[a-zA-Z*\/].*)/gm,
			'$1 $2$3 <i>// {format($2)}</i>'
		)
		.replace(
			// Display value after assignment with multi-line value
			/^(const|let)\s*(\S+)(\s*=\s*)$/gm,
			'$1 $2$3 <i>// {format($2)}</i>'
		)
		.replace(
			// Insert range input after variable declaration with step
			/^(let)\s*(\S+)\s*=\s*(\d+):(\d+):(\d+):(\d+)(.*)/gm,
			'$1 $2 = ' +
				(interactive ? ' <input type=range min=$3 max=$5 step=$6 bind:value={$2}>' : '') +
				' {$2}$7'
		)
		.replace(
			// Insert range input after variable declaration
			/^(let)\s*(\S+)\s*=\s*(\d+):(\d+):(\d+)(.*)/gm,
			'$1 $2 = ' +
				(interactive ? '<input type=range min=$3 max=$5 bind:value={$2}>' : '') +
				' {$2}$6'
		);

	return { runCode, displayCode };
}

function loadFile(file, extension) {
	const fullname = `${file}.${extension}`;
	// filename relative to content file
	const relfile = resolve(currentDir, fullname);

	// buildimage/<contentfile>/<fullname>
	const buildimageFile = `${projectRoot}/buildimage/${currentBasename}/${fullname}`;

	let data = undefined;
	try {
		data = readFileSync(relfile);
		dependencies.push(relfile);
	} catch (err) {}

	if (data === undefined) {
		try {
			data = readFileSync(buildimageFile);
			dependencies.push(buildimageFile);
		} catch (err) {}
	}
	return data;
}

function processSvg(file) {
	const data = loadFile(file, 'svg');

	if (data === undefined) {
		return `<b>Failed to find ${file}</b>`;
	} else {
		return data.toString().replace(/[\s\S]*<svg/m, '<svg');
	}
}

function processDrawio(file) {
	if (process.env.DRAWIO_FMT === 'png') {
		return processPng(file);
	} else {
		return processSvg(file);
	}
}

function processPng(file) {
	const data = loadFile(file, 'png');

	if (data === undefined) {
		return `<b>Failed to find png ${file}</b>`;
	} else {
		return `<img alt="${file}" src="data:image/png;base64,${data.toString('base64')}" />`;
	}
}

const renderer = {
	code: (code, infostring, escaped) => {
		const { runCode, displayCode } = processCode(code, true);

		allRunCode += '\n' + runCode;
		infostring = infostring.split(' ').pop();
		if (infostring === 'hidden' || infostring === 'webonly') {
			return '';
		} else {
			return `<pre><code>${displayCode}</code></pre>`;
		}
	},
	text: (text) => {
		text = text
			.replace(/svg:(\S+)/g, (_, file) => processSvg(file))
			.replace(/drawio:(\S+)/g, (_, file) => processDrawio(file))
			.replace(/png:(\S+)/g, (_, file) => processPng(file));
		return text;
	}
};

function logger(prefix) {
	return {
		markup: ({ content, filename }) => {
			if (filename.endsWith('.md')) {
				console.log(`=== ${prefix} markup ${filename}\n${content}\n`);
				return {
					code: content
				};
			}
		},
		script: ({ content }) => {
			console.log(`=== ${prefix} script\n${content}\n`);
			return {
				code: content
			};
		},
		style: ({ content }) => {
			console.log(`=== ${prefix} style\n${content}\n`);
			return {
				code: content
			};
		}
	};
}

function markdownSvelte() {
	marked.use({ renderer });
	return {
		markup: ({ content, filename }) => {
			if (filename.endsWith('.md')) {
				currentDir = dirname(filename);
				const [, m] = filename.match(/src\/routes\/(.*)\.md$/);
				currentBasename = m;
				const [, m2] = filename.match(/(.*)\/src\/routes\//);
				projectRoot = m2;

				allRunCode = globalCode;
				dependencies = [];
				const mdHtml = marked.parse(content);
				let html = `<script>${allRunCode}</script>` + mdHtml;

				return {
					code: html,
					dependencies
				};
			} else {
				return {
					code: content
				};
			}
		}
	};
}

const markdownRenderer = {
	code: (code, infostring, escaped) => {
		const { runCode, displayCode } = processCode(code, false);
		const infotype = infostring.split(/\s+/).pop();
		if (infotype === 'hidden') {
			allRunCode += '\n' + runCode;
			return '';
		} else if (infotype === 'webonly') {
			return '';
		} else {
			allRunCode += '\n' + runCode;
			return '\n```' + infostring + `\n${displayCode}\n` + '```\n\n';
		}
	},

	blockquote: (quote) => {
		return `> ${quote}\n`;
	},

	html: (html) => {
		return '';
	},

	heading: (text, level, raw, slugger) => {
		return `\n${'#'.repeat(level)} ${text}\n`;
	},

	hr: () => '---\n',

	list: (body, ordered, start) => {
		if (ordered) {
			function num() {
				const res = `${start}.`;
				start++;
				return res;
			}

			return body.replace(/^-/gm, num);
		} else {
			let items = body.trim().split('\n');
			// items = items.map((item, i) => (i > 0 ? '  ' : '') + item);
			return '\n' + items.join('\n') + '\n';
		}
	},

	listitem: (text, task, checked) => {
		let items = text.trim().split('\n');
		items = items.map((item, i) => (i > 0 ? '  ' : '- ') + item);
		return items.join('\n') + '\n';
	},

	// checkbox(boolean checked)
	paragraph: (text) => {
		return text + '\n';
	},

	// table(string header, string body)
	// tablerow(string content)
	// tablecell(string content, object flags)

	// Inline render methods
	strong: (text) => `**${text}**`,
	em: (text) => `_${text}_`,
	codespan: (code) => `\`${code}\``,
	// br()
	del: (text) => `~~${text}~~`
	// link(string href, string title, string text)
	// image(string href, string title, string text)
	// text(string text)
};

function evalExpression(expr) {
	const fn = `${allRunCode};${expr}`;
	return eval(fn);
}

function roundtrip(markdown) {
	allRunCode = globalCode;
	marked.use({ renderer: markdownRenderer });
	const result = marked.parse(markdown);
	return result
		.replace(/\{(.*?)\}/g, evalExpression)
		.replace(/&#123;/g, '{')
		.replace(/&#125;/g, '}');
}

module.exports = { logger, markdownSvelte, roundtrip };
