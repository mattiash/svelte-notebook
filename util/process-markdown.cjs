const { markdown, Renderer } = require('svelte-preprocess-markdown');
const renderer = Renderer();

const globalCode = `
function format(num) {
	return num.toLocaleString()
}
`;

let allRunCode = globalCode;

renderer.codeOrg = renderer.code;
renderer.code = (code, infostring, escaped) => {
	const runCode = code
		// Replace ranges with default value
		.replace(/\d+:(\d+):\d+(:\d+){0,1}/g, '$1');

	allRunCode = allRunCode + '\n' + runCode;

	const displayCode = code.replace(/\$: /g, 'let ');
	console.log(displayCode);
	const htmlCode = renderer.codeOrg(displayCode, infostring, escaped);
	return htmlCode
		.replace(
			// Display value after assignment with non-numeric value
			/(^|<code>)(const|let)\s*(\S+)(\s*=.*[a-zA-Z].*)/gm,
			'$1$2 $3$4 <i>// {format($3)}</i>'
		)
		.replace(
			// Insert range input after variable declaration with step
			/(^|<code>)(let)\s*(\S+)\s*=\s*(\d+):(\d+):(\d+):(\d+)(.*)/gm,
			'$1$2 $3 = {$3}$8 <input type=range min=$4 max=$6 step=$7 bind:value={$3}>'
		)
		.replace(
			// Insert range input after variable declaration
			/(^|<code>)(let)\s*(\S+)\s*=\s*(\d+):(\d+):(\d+)(.*)/gm,
			'$1$2 $3 = {$3}$7 <input type=range min=$4 max=$6 bind:value={$3}>'
		);
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
		}
		// script: ({ content }) => {
		//     console.log(`=== ${prefix} script\n${content}\n`)
		//     return {
		//         code: content
		//     };
		// },
		// style: ({ content }) => {
		//     console.log(`=== ${prefix} style\n${content}\n`)
		//     return {
		//         code: content
		//     };
		// }
	};
}

function processMarkdown() {
	const md = markdown({ renderer });
	return {
		markup: ({ content, filename }) => {
			if (filename.endsWith('.md')) {
				allRunCode = globalCode;
				const mdresult = md.markup({ content, filename });
				let mdHtml = mdresult.code;
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
