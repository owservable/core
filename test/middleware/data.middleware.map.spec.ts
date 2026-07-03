'use strict';

import DataMiddlewareMap from '../../src/middleware/data.middleware.map';

describe('data.middleware.map tests', () => {
	it('DataMiddlewareMap exists', () => {
		expect(DataMiddlewareMap).toBeDefined();
		expect(typeof DataMiddlewareMap).toBe('function');
	});

	it('DataMiddlewareMap functionality', () => {
		let keys: string[] = DataMiddlewareMap.keys();
		expect(keys).toHaveLength(0);
		expect(DataMiddlewareMap.hasMiddleware('users')).toBe(false);
		expect(DataMiddlewareMap.getMiddleware('users')).toBeUndefined();

		const processor = (doc: unknown): unknown => doc;

		DataMiddlewareMap.addMiddleware('users', processor);
		keys = DataMiddlewareMap.keys();
		expect(keys).toHaveLength(1);
		expect(DataMiddlewareMap.hasMiddleware('users')).toBe(true);
		expect(DataMiddlewareMap.getMiddleware('users')).toBe(processor);
	});
});
