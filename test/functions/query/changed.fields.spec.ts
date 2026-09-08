'use strict';

import changedFields from '../../../src/functions/query/changed.fields';

describe('changed.fields tests', () => {
	it('should be defined', () => {
		expect(changedFields).toBeDefined();
		expect(typeof changedFields).toBe('function');
	});

	it('should return an empty list without an update description', () => {
		expect(changedFields({})).toEqual([]);
		expect(changedFields(null)).toEqual([]);
		expect(changedFields({operationType: 'insert'})).toEqual([]);
		expect(changedFields({updateDescription: {}})).toEqual([]);
	});

	it('should combine removed and updated fields', () => {
		const change: any = {
			updateDescription: {
				updatedFields: {is_deleted: true, updated_at: 'now'},
				removedFields: ['legacy']
			}
		};
		expect(changedFields(change)).toEqual(['legacy', 'is_deleted', 'updated_at']);
	});

	it('should tolerate missing updatedFields or removedFields', () => {
		expect(changedFields({updateDescription: {removedFields: ['a']}})).toEqual(['a']);
		expect(changedFields({updateDescription: {updatedFields: {b: 1}}})).toEqual(['b']);
	});

	it('should reduce dotted paths to their root field and dedupe', () => {
		const change: any = {
			updateDescription: {
				updatedFields: {'address.city': 'X', 'address.zip': '1'},
				removedFields: ['address.street']
			}
		};
		expect(changedFields(change)).toEqual(['address']);
	});
});
