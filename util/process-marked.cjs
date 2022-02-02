const { marked } = require('marked');

const globalCode = `
function format(num) {
	return num.toLocaleString()
}
`;

let allRunCode = globalCode;

function process(code, interactive) {
	const runCode = code
		// Replace ranges with default value
		.replace(/\d+:(\d+):\d+(:\d+){0,1}/g, '$1');

	const displayCode = code
		.replace(/\$: /g, 'let ')
		.replace(/{/g, '&#123;')
		.replace(/}/g, '&#125;')
		.replace(
			// Display value after assignment with non-numeric value
			/^(const|let)\s*(\S+)(\s*=.*[a-zA-Z].*)/gm,
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

const renderer = {
	code: (code, infostring, escaped) => {
		const { runCode, displayCode } = process(code, true);

		allRunCode += '\n' + runCode;
		infostring = infostring.split(' ').pop();
		if (infostring === 'hidden' || infostring === 'webonly') {
			return '';
		} else {
			return `<pre><code>${displayCode}</code></pre>`;
		}
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
				allRunCode = globalCode;
				const mdHtml = marked.parse(content);
				let html = `<script>${allRunCode}</script>` + mdHtml;

				return {
					code: html
				};
			} else {
				return {
					code: content
					// More properties?
				};
			}
		}
	};
}

const markdownRenderer = {
	code: (code, infostring, escaped) => {
		const { runCode, displayCode } = process(code, false);
		const infotype = infostring.split(/\s+/).pop();
		if (infotype === 'hidden') {
			allRunCode += runCode;
			return '';
		} else if (infotype === 'webonly') {
			return '';
		} else {
			allRunCode += runCode;
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
