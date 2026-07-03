'use strict';

import getMillisecondsFrom from '../../../src/functions/performance/get.milliseconds.from';
import getHrtimeAsNumber from '../../../src/functions/performance/get.hrtime.as.number';

describe('get.milliseconds.from tests', () => {
	it('should be defined', () => {
		expect(getMillisecondsFrom).toBeDefined();
		expect(typeof getMillisecondsFrom).toBe('function');
	});

	it('should return a non-negative number', () => {
		const start: number = getHrtimeAsNumber();
		const result: number = getMillisecondsFrom(start);
		expect(typeof result).toBe('number');
		expect(result).toBeGreaterThanOrEqual(0);
	});

	it('should return a very small value for an immediate timestamp', () => {
		const now: number = getHrtimeAsNumber();
		const result: number = getMillisecondsFrom(now);
		expect(result).toBeGreaterThanOrEqual(0);
		expect(result).toBeLessThan(1000);
	});

	it('should return increasing values for elapsed time', () => {
		const start: number = getHrtimeAsNumber();
		const after1: number = getMillisecondsFrom(start);
		const after2: number = getMillisecondsFrom(start);

		expect(after2).toBeGreaterThanOrEqual(after1);
	});

	it('should return milliseconds as 1000x seconds', () => {
		const start: number = getHrtimeAsNumber() - 1000000000;
		const result: number = getMillisecondsFrom(start);

		expect(result).toBeGreaterThan(999);
		expect(result).toBeLessThan(1100);
	});

	it('should return valid decimal milliseconds', () => {
		const start: number = getHrtimeAsNumber() - 1500000000;
		const result: number = getMillisecondsFrom(start);

		expect(result).toBeGreaterThan(1499);
		expect(Number.isFinite(result)).toBe(true);
	});
});
