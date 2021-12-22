const { marked } = require('marked');

const globalCode = `
function format(num) {
	return num.toLocaleString()
}
`;

let allRunCode = globalCode;

const renderer = {
	code: (code, infostring, escaped) => {
		console.log('code', code, escaped);
		const runCode = code
			// Replace ranges with default value
			.replace(/\d+:(\d+):\d+(:\d+){0,1}/g, '$1');

		allRunCode = allRunCode + '\n' + runCode;

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
				// Insert range input after variable declaration with step
				/^(let)\s*(\S+)\s*=\s*(\d+):(\d+):(\d+):(\d+)(.*)/gm,
				'$1 $2 = {$2}$7 <input type=range min=$3 max=$5 step=$6 bind:value={$2}>'
			)
			.replace(
				// Insert range input after variable declaration
				/^(let)\s*(\S+)\s*=\s*(\d+):(\d+):(\d+)(.*)/gm,
				'$1 $2 = {$2}$6 <input type=range min=$3 max=$5 bind:value={$2}>'
			);

		return `<pre><code>${displayCode}</code></pre>`;
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

function processMarkdown() {
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

module.exports = { logger, processMarkdown };
