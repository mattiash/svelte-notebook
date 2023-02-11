export function hello() {
	return 'Hello';
}

const prefix = ['k', 'M', 'G', 'T', 'P'];

export function toPrefixed(v) {
	for (let n = prefix.length - 1; n >= 0; n--) {
		const divisor = 10 ** ((n + 1) * 3);
		if (v > divisor) {
			return (v / divisor).toPrecision(3) + ' ' + prefix[n];
		}
	}
	return v + ' ';
}

export function bps(v) {
	return toPrefixed(v) + 'bps';
}

export function Mbps(v) {
	return bps(v * 1_000_000);
}

export function B(v) {
	return toPrefixed(v) + 'B';
}

export function MB(v) {
	return B(v * 1_000_000);
}

export function Bps(v) {
	return toPrefixed(v) + 'Bps';
}

export function MBps(v) {
	return Bps(v * 1_000_000);
}
