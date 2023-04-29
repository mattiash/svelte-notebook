import { terser } from 'rollup-plugin-terser';

export default {
	output: {
		sourcemap: true,
		format: 'iife',
		name: 'app',
		plugins: [terser()],
		manualChunks: () => 'everything.js'
	},
	plugins: [terser()]
};
