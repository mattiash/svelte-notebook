import adapter from '@sveltejs/adapter-static';
import { markdownSvelte } from './util/process-marked.cjs';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.md'],
	preprocess: [markdownSvelte()],
	kit: {
		adapter: adapter()
	}
};

export default config;
