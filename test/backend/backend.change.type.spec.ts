'use strict';

import type BackendChangeType from '../../src/backend/backend.change.type';

describe('backend.change.type tests', () => {
	it('allows describing a full change event', () => {
		const change: BackendChangeType = {
			ns: {db: 'test', coll: 'users'},
			documentKey: {_id: 'abc'},
			operationType: 'update',
			updateDescription: {
				updatedFields: {name: 'updated'},
				removedFields: ['obsolete']
			},
			fullDocument: {_id: 'abc', name: 'updated'}
		};

		expect(change.operationType).toBe('update');
		expect(change.documentKey).toEqual({_id: 'abc'});
		expect(change.updateDescription.updatedFields).toEqual({name: 'updated'});
		expect(change.updateDescription.removedFields).toEqual(['obsolete']);
		expect(change.fullDocument).toEqual({_id: 'abc', name: 'updated'});
	});

	it('allows an empty change event since all fields are optional', () => {
		const change: BackendChangeType = {};
		expect(change).toEqual({});
	});
});
