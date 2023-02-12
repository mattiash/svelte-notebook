import { marked } from 'marked';
import { readFileSync } from 'fs';

const globalCode = `
function format(num) {
	return num.toLocaleString()
}
`;

const SPACER_P = '<p class="spacer">&nbsp;</p>';

class Renderer {
	constructor(paths) {
		this.paths = paths;
		this.allRunCode = globalCode;
		this.dependencies = [];
	}

	loadFile(file, extension) {
		const fullname = `${file}.${extension}`;

		for (const path of this.paths) {
			try {
				const f = `${path}/${fullname}`;
				const data = readFileSync(f);
				this.dependencies.push(f);
				return data;
			} catch (err) {}
		}

		return undefined;
	}

	processSvgInline(file) {
		const data = this.loadFile(file, 'svg');

		if (data === undefined) {
			return `<b>Failed to find ${file}</b>`;
		} else {
			return data.toString().replace(/[\s\S]*<svg/m, '<svg');
		}
	}

	processDrawio(file) {
		if (process.env.DRAWIO_FMT === 'png') {
			return this.processPng(file);
		} else if (process.env.DRAWIO_FMT === 'svg') {
			return this.processSvg(file);
		} else {
			return this.processSvgInline(file);
		}
	}

	processPng(file) {
		const data = this.loadFile(file, 'png');

		if (data === undefined) {
			return `<b>Failed to find png ${file}</b>`;
		} else {
			return `<img alt="${file}" src="data:image/png;base64,${data.toString('base64')}" />`;
		}
	}

	processSvg(file) {
		const data = this.loadFile(file, 'svg');

		if (data === undefined) {
			return `<b>Failed to find svg ${file}</b>`;
		} else {
			return `<img alt="${file}" src="data:image/svg+xml;base64,${data.toString('base64')}" />`;
		}
	}

	processCode(code, interactive) {
		const runCode = code
			// Replace ranges with default value
			.replace(/\d+:(\d+):\d+(:\d+){0,1}/g, '$1')
			.replace(/\$lib\//g, '../../../lib/');

		const displayCode = code
			.replace(/\$: /g, 'let ')
			.replace(/{/g, '&#123;')
			.replace(/}/g, '&#125;')
			.replace(/</g, '&lt;')
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

	processEscapeOnly(code) {
		return code.replace(/{/g, '&#123;').replace(/}/g, '&#125;').replace(/</g, '&lt;');
	}

	renderer() {
		return {
			code: (code, infostring, escaped) => {
				const [lang, instruction] = (infostring || '').split(' ');
				if (lang === 'js' && instruction !== 'ignore') {
					const { runCode, displayCode } = this.processCode(code, true);
					this.allRunCode += '\n' + runCode;

					if (instruction === 'hidden' || instruction === 'webonly') {
						return '';
					} else {
						return `<pre><code>${displayCode}</code></pre>`;
					}
				} else {
					return `<pre><code>${this.processEscapeOnly(code)}</code></pre>`;
				}
			},
			text: (text) => {
				text = text
					.replace(/svg:(\S+)/g, (_, file) => this.processSvgInline(file))
					.replace(/drawio:(\S+)/g, (_, file) => this.processDrawio(file))
					.replace(/png:(\S+)/g, (_, file) => this.processPng(file));
				return text;
			},
			paragraph: (content) => {
				if (content.startsWith('<img') || content.startsWith('<svg')) {
					return `<p class="img">${content}</p>`;
				} else {
					return `<p>${content}</p>${SPACER_P}`;
				}
			}
		};
	}
}

// function logger(prefix) {
// 	return {
// 		markup: ({ content, filename }) => {
// 			if (filename.endsWith('.md')) {
// 				console.log(`=== ${prefix} markup ${filename}\n${content}\n`);
// 				return {
// 					code: content
// 				};
// 			}
// 		},
// 		script: ({ content }) => {
// 			console.log(`=== ${prefix} script\n${content}\n`);
// 			return {
// 				code: content
// 			};
// 		},
// 		style: ({ content }) => {
// 			console.log(`=== ${prefix} style\n${content}\n`);
// 			return {
// 				code: content
// 			};
// 		}
// 	};
// }

// function markdownSvelte() {
// 	marked.use({ renderer });
// 	return {
// 		markup: ({ content, filename }) => {
// 			if (filename.endsWith('.md')) {
// 				currentDir = dirname(filename);
// 				const [, m] = filename.match(/src\/routes\/(.*)\.md$/);
// 				currentBasename = m;
// 				const [, m2] = filename.match(/(.*)\/src\/routes\//);
// 				projectRoot = m2;

// 				allRunCode = globalCode;
// 				dependencies = [];
// 				const mdHtml = marked.parse(content);
// 				let html = `<script>${allRunCode}</script>` + mdHtml;

// 				return {
// 					code: html,
// 					dependencies
// 				};
// 			} else {
// 				return {
// 					code: content
// 				};
// 			}
// 		}
// 	};
// }

// const markdownRenderer = {
// 	code: (code, infostring, escaped) => {
// 		const { runCode, displayCode } = processCode(code, false);
// 		const infotype = infostring.split(/\s+/).pop();
// 		if (infotype === 'hidden') {
// 			allRunCode += '\n' + runCode;
// 			return '';
// 		} else if (infotype === 'webonly') {
// 			return '';
// 		} else {
// 			allRunCode += '\n' + runCode;
// 			return '\n```' + infostring + `\n${displayCode}\n` + '```\n\n';
// 		}
// 	},

// 	blockquote: (quote) => {
// 		return `> ${quote}\n`;
// 	},

// 	html: (html) => {
// 		return '';
// 	},

// 	heading: (text, level, raw, slugger) => {
// 		return `\n${'#'.repeat(level)} ${text}\n`;
// 	},

// 	hr: () => '---\n',

// 	list: (body, ordered, start) => {
// 		if (ordered) {
// 			function num() {
// 				const res = `${start}.`;
// 				start++;
// 				return res;
// 			}

// 			return body.replace(/^-/gm, num);
// 		} else {
// 			let items = body.trim().split('\n');
// 			// items = items.map((item, i) => (i > 0 ? '  ' : '') + item);
// 			return '\n' + items.join('\n') + '\n';
// 		}
// 	},

// 	listitem: (text, task, checked) => {
// 		let items = text.trim().split('\n');
// 		items = items.map((item, i) => (i > 0 ? '  ' : '- ') + item);
// 		return items.join('\n') + '\n';
// 	},

// 	// checkbox(boolean checked)
// 	paragraph: (text) => {
// 		return text + '\n';
// 	},

// 	// table(string header, string body)
// 	// tablerow(string content)
// 	// tablecell(string content, object flags)

// 	// Inline render methods
// 	strong: (text) => `**${text}**`,
// 	em: (text) => `_${text}_`,
// 	codespan: (code) => `\`${code}\``,
// 	// br()
// 	del: (text) => `~~${text}~~`
// 	// link(string href, string title, string text)
// 	// image(string href, string title, string text)
// 	// text(string text)
// };

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

export function htmlFromMarkdown(filename, paths) {
	const renderer = new Renderer(paths);

	marked.use({ renderer: renderer.renderer() });

	const content = readFileSync(filename).toString();

	const mdHtml = marked.parse(content);
	const mdHtml2 = mdHtml.replace(new RegExp(SPACER_P + '(?!<p>)', 'g'), '');
	return `<script>${renderer.allRunCode}</script>` + mdHtml2;
}
