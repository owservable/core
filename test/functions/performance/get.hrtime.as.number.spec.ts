'use strict';

import getHrtimeAsNumber from '../../../src/functions/performance/get.hrtime.as.number';

describe('get.hrtime.as.number tests', () => {
	it('should be defined', () => {
		expect(getHrtimeAsNumber).toBeDefined();
		expect(typeof getHrtimeAsNumber).toBe('function');
	});

	it('should return a positive number', () => {
		const result: number = getHrtimeAsNumber();
		expect(typeof result).toBe('number');
		expect(result).toBeGreaterThan(0);
	});

	it('should return increasing values when called multiple times', () => {
		const first: number = getHrtimeAsNumber();
		const second: number = getHrtimeAsNumber();
		const third: number = getHrtimeAsNumber();

		expect(second).toBeGreaterThanOrEqual(first);
		expect(third).toBeGreaterThanOrEqual(second);
	});

	it('should return finite integers usable for time calculations', () => {
		const start: number = getHrtimeAsNumber();
		const end: number = getHrtimeAsNumber();
		const elapsed: number = end - start;

		expect(elapsed).toBeGreaterThanOrEqual(0);
		expect(Number.isInteger(start)).toBe(true);
		expect(Number.isFinite(start)).toBe(true);
	});
});
