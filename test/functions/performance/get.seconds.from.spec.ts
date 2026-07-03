'use strict';

import getSecondsFrom, {NS_PER_SEC} from '../../../src/functions/performance/get.seconds.from';
import getHrtimeAsNumber from '../../../src/functions/performance/get.hrtime.as.number';

describe('get.seconds.from tests', () => {
	it('should be defined', () => {
		expect(getSecondsFrom).toBeDefined();
		expect(typeof getSecondsFrom).toBe('function');
	});

	it('should export NS_PER_SEC constant', () => {
		expect(NS_PER_SEC).toBe(1e9);
		expect(typeof NS_PER_SEC).toBe('number');
	});

	it('should return a non-negative number', () => {
		const start: number = getHrtimeAsNumber();
		const result: number = getSecondsFrom(start);
		expect(typeof result).toBe('number');
		expect(result).toBeGreaterThanOrEqual(0);
	});

	it('should return increasing values for elapsed time', () => {
		const start: number = getHrtimeAsNumber();
		const after1: number = getSecondsFrom(start);
		const after2: number = getSecondsFrom(start);

		expect(after2).toBeGreaterThanOrEqual(after1);
	});

	it('should return valid decimal seconds', () => {
		const start: number = getHrtimeAsNumber() - 1500000000;
		const result: number = getSecondsFrom(start);

		expect(result).toBeGreaterThan(1.499);
		expect(Number.isFinite(result)).toBe(true);
	});

	it('should handle different start times correctly', async () => {
		const start1: number = getHrtimeAsNumber();
		await new Promise((resolve) => setTimeout(resolve, 2));
		const start2: number = getHrtimeAsNumber();

		const elapsed1: number = getSecondsFrom(start1);
		const elapsed2: number = getSecondsFrom(start2);

		expect(elapsed1).toBeGreaterThan(elapsed2);
	});
});
