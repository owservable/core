'use strict';

import EStoreType from '../../src/enums/store.type.enum';

describe('store.type.enum tests', () => {
	it('exposes the expected enum fields', () => {
		expect(EStoreType).toBeDefined();
		expect(typeof EStoreType).toBe('object');
		expect(EStoreType.DOCUMENT).toBe(0);
		expect(EStoreType.COLLECTION).toBe(1);
		expect(EStoreType.COUNT).toBe(2);
	});
});
