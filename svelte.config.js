import adapter from '@sveltejs/adapter-auto';
import { markdownSvelte } from './util/process-marked.cjs';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.md'],
	preprocess: [markdownSvelte()],
	kit: {
		adapter: adapter(),

		// hydrate the <div id="svelte"> element in src/app.html
		target: '#svelte'
	}
};

export default config;
