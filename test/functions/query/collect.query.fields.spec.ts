'use strict';

import collectQueryFields from '../../../src/functions/query/collect.query.fields';

describe('collect.query.fields tests', () => {
	it('should be defined', () => {
		expect(collectQueryFields).toBeDefined();
		expect(typeof collectQueryFields).toBe('function');
	});

	it('should return an empty list for empty, null and string queries', () => {
		expect(collectQueryFields({})).toEqual([]);
		expect(collectQueryFields(null)).toEqual([]);
		expect(collectQueryFields(undefined)).toEqual([]);
		expect(collectQueryFields('some-id')).toEqual([]);
	});

	it('should collect flat query keys', () => {
		expect(collectQueryFields({is_deleted: false, status: {$in: ['a', 'b']}})).toEqual(['is_deleted', 'status']);
	});

	it('should collect keys nested inside $or, $and and $nor', () => {
		const query: any = {
			$or: [{is_deleted: {$eq: null}}, {is_deleted: {$eq: false}}],
			$and: [{company_id: 'c1'}, {$nor: [{archived: true}]}]
		};
		expect(collectQueryFields(query)).toEqual(['is_deleted', 'company_id', 'archived']);
	});

	it('should collect keys from an array of queries', () => {
		expect(collectQueryFields([{a: 1}, {b: 2}])).toEqual(['a', 'b']);
	});

	it('should reduce dotted paths to their root field', () => {
		expect(collectQueryFields({'address.city': 'X', 'address.country': 'Y'})).toEqual(['address']);
	});

	it('should collect field references from $expr', () => {
		const query: any = {
			$expr: {$regexMatch: {input: {$toString: '$code'}, regex: 'abc', options: 'i'}}
		};
		expect(collectQueryFields(query)).toEqual(['code']);
	});

	it('should collect field references from arrays inside operators and ignore variables', () => {
		const query: any = {
			$expr: {$gt: ['$price.amount', '$$NOW', '$', 12, null]}
		};
		expect(collectQueryFields(query)).toEqual(['price']);
	});

	it('should ignore non-field operator values', () => {
		expect(collectQueryFields({$text: {$search: 'hello'}, $where: 'this.a > 1'})).toEqual([]);
	});
});
