import { htmlFromMarkdown } from './src/markdown.js';
import { mkdir, writeFile, copyFile, readFile, rm, stat, readdir } from 'node:fs/promises';
import { promisify } from 'node:util';
import { exec } from 'node:child_process';
const execP = promisify(exec);

const pages = 'pages';
const build = 'build';
const drawio = `${build}/drawio`;
const stage1 = `${build}/stage1`;
const stage2 = `${build}/stage2`;
const templates = 'templates';
const output = 'output';

async function clean() {
	await rm(build, { recursive: true, foce: true });
	await rm(output, { recursive: true, foce: true });
}

/**
 * Returns the last modified timestamp of a file. If the file is a directory,
 * it returns the last modified timestamp of the most recently modified file
 * in the directory
 * @param {string} file
 * @returns {number}
 */
async function modifiedTime(file) {
	try {
		const fileStat = await stat(file);
		if (fileStat.isFile()) {
			return fileStat.mtimeMs;
		} else if (fileStat.isDirectory()) {
			let latest = 0;
			for (const dirFile of await readdir(file)) {
				latest = Math.max(latest, await modifiedTime(`${file}/${dirFile}`));
			}
			return latest;
		}
	} catch {}
	return 0;
}

async function ensureDirs(doc) {
	await mkdir(`${drawio}/${doc}`, { recursive: true });
	await mkdir(`${stage1}/${doc}`, { recursive: true });
	await mkdir(`${stage2}/${doc}`, { recursive: true });
	await mkdir(`${output}`, { recursive: true });
}

async function generateDrawioIfUpdated(doc) {
	if (
		(await modifiedTime(`${drawio}/${doc}`)) < (await modifiedTime(`${pages}/${doc}/index.drawio`))
	) {
		console.log(doc, 'drawio');
		const res = await execP(
			`./node_modules/.bin/drawio-export -o ${drawio}/${doc}/ -f ${
				process.env.DRAWIO_FMT || 'svg'
			} ${pages}/${doc}/index.drawio`
		);
		console.log(res.stdout, res.stderr);
	}
}
async function generateStage1(doc) {
	console.log(doc, 'stage1');
	// Generate stage 1
	// copy templates/
	// Markdown -> index.svelte
	// drawio -> png and inline?
	// copy jpg/png or just inline them?
	await copyFile(`${templates}/index.js`, `${stage1}/${doc}/index.js`);
	await writeFile(
		`${stage1}/${doc}/index.svelte`,
		htmlFromMarkdown(`${pages}/${doc}/index.md`, [`${pages}/${doc}`, `${drawio}/${doc}`])
	);
}

async function generateStage2(doc) {
	console.log(doc, 'stage2');
	// Generate stage 2
	// Svelte -> html/js
	// copy jpg/png ?
	let rollup = (await readFile(`${templates}/rollup.config.js`)).toString();
	rollup = rollup
		.replace('%%input%%', `${stage1}/${doc}/index.js`)
		.replace('%%output%%', `${stage2}/${doc}/bundle.js`);
	await writeFile(`${stage1}/${doc}/rollup.config.js`, rollup);
	await execP(`./node_modules/.bin/rollup -c ${stage1}/${doc}/rollup.config.js`);
}

async function generateOutput(doc) {
	console.log(doc, 'output');
	// Generate output
	// html/js -> html with inline js
	const js = (await readFile(`${stage2}/${doc}/bundle.js`))
		.toString()
		.replace(/<\/body>/g, '</body >'); // Work-around for live-reload
	let html = (await readFile(`${templates}/index.html`)).toString();
	const [before, after] = html.split('%%xxjavascript%%');
	await writeFile(`${output}/${doc}.html`, before + js + after);
}

async function run() {
	for (const doc of await readdir(pages)) {
		await ensureDirs(doc);
		if ((await modifiedTime(`${output}/${doc}.html`)) < (await modifiedTime(`${pages}/${doc}`))) {
			await generateDrawioIfUpdated(doc);
			await generateStage1(doc);
			await generateStage2(doc);
			await generateOutput(doc);
		}
	}
}

run();
