'use strict';

import {Observable, Subject} from 'rxjs';

import type IObservableBackend from '../../src/backend/i.observable.backend';

describe('i.observable.backend tests', () => {
	it('allows implementing the observable backend contract', async () => {
		const changes: Subject<any> = new Subject<any>();
		const backend: IObservableBackend = {
			target: (): string => 'users',
			changes: (): Observable<any> => changes,
			find: async (): Promise<any[]> => [{_id: '1'}],
			findOne: async (): Promise<any> => ({_id: '1'}),
			findById: async (id: string): Promise<any> => ({_id: id}),
			count: async (): Promise<number> => 42,
			populate: async (document: any): Promise<any> => document,
			toJSON: (document: any): any => document,
			resolveVirtuals: async (document: any): Promise<any> => document
		};

		expect(backend.target()).toBe('users');
		expect(backend.changes()).toBe(changes);
		await expect(backend.find({}, {}, {}, {}, [])).resolves.toEqual([{_id: '1'}]);
		await expect(backend.findOne({}, {}, [])).resolves.toEqual({_id: '1'});
		await expect(backend.findById('7', {}, [])).resolves.toEqual({_id: '7'});
		await expect(backend.count({})).resolves.toBe(42);
		await expect(backend.populate({_id: '1'}, 'user')).resolves.toEqual({_id: '1'});
		expect(backend.toJSON({_id: '1'})).toEqual({_id: '1'});
		await expect(backend.resolveVirtuals({_id: '1'}, ['v'])).resolves.toEqual({_id: '1'});
	});
});
