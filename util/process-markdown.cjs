const { markdown, Renderer } = require('svelte-preprocess-markdown');
const renderer = Renderer();

let allCode = '';

renderer.codeOrg = renderer.code;
renderer.code = (code, infostring, escaped) => {
	console.log(infostring);
	allCode = allCode + code;
	code = code.replace(/\$:/g, '');
	const org = renderer.codeOrg(code, infostring, escaped);
	// Log org here if you ever want to change this...
	return org;
	// return org.replace('<code>', '<code>{`').replace('</code>', '`}</code>');
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
				allCode = '';
				const mdresult = md.markup({ content, filename });
				let mdHtml = mdresult.code;
				let html = `<script>${allCode}</script>` + mdHtml;

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
