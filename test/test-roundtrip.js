import { test } from 'purple-tape';
import { roundtrip } from '../util/process-marked.cjs';

test('roundtrip', (t) => {
	const list = `\n- item 1\n- item 2\n`;
	t.equal(roundtrip(list), list, 'list');

	const nestedlist = `\n- item 1\n  - item 1a\n  - item 1b\n- item 2\n`;
	t.equal(roundtrip(nestedlist), nestedlist, 'nested list');

	const orderedlist = '1. item 1\n2. item 2\n';
	t.equal(roundtrip(orderedlist), orderedlist, 'ordered list');
});
