import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import postcss from 'rollup-plugin-postcss';

const dev = !!process.env.DEV;

export default {
	input: '%%input%%',
	output: {
		sourcemap: true,
		format: 'iife',
		name: 'app',
		file: '%%output%%'
	},
	plugins: [
		svelte(),
		postcss(),

		// If you have external dependencies installed from
		// npm, you'll most likely need these plugins. In
		// some cases you'll need additional configuration —
		// consult the documentation for details:
		// https://github.com/rollup/rollup-plugin-commonjs
		resolve({ browser: true }),
		commonjs({
			extensions: ['.js', '.svelte']
		}),

		dev ? undefined : terser()
	],
	watch: {
		clearScreen: false
	},
	onwarn: (warning, rollupWarn) => {
		// console.log(warning)
		if (warning.pluginCode === 'a11y-missing-attribute') return;
		if (warning.code === 'CIRCULAR_DEPENDENCY') return;
		rollupWarn(warning);
	}
};
