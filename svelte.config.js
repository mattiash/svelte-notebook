import adapter from '@sveltejs/adapter-static';
import { markdownSvelte } from './util/process-marked.cjs';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.md'],
	preprocess: [markdownSvelte()],
	kit: {
		adapter: adapter(),
		routes: (filepath) => {
			return ![
				// exclude *test.js files
				/.drawio$/,

				// original default config
				/(?:(?:^_|\/_)|(?:^\.|\/\.)(?!well-known))/
			].some((regex) => regex.test(filepath));
		}
	}
};

export default config;
