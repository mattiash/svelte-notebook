import { roundtrip } from './process-marked.cjs';
import { readFileSync } from 'fs';

const input = readFileSync(0).toString();

const output = roundtrip(input);
console.log(output);
