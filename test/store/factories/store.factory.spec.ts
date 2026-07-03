'use strict';

import {Subject} from 'rxjs';

import storeFactory from '../../../src/store/factories/store.factory';
import BackendRegistry from '../../../src/backend/backend.registry';
import IObservableBackend from '../../../src/backend/i.observable.backend';
import AStore from '../../../src/store/a.store';
import CountStore from '../../../src/store/count.store';
import DocumentStore from '../../../src/store/document.store';
import CollectionStore from '../../../src/store/collection.store';

describe('store.factory tests', () => {
	let mockBackend: IObservableBackend;

	beforeEach(() => {
		BackendRegistry.clear();
		mockBackend = {
			target: jest.fn(() => 'testCollection'),
			changes: jest.fn(() => new Subject<any>()),
			find: jest.fn(async () => []),
			findOne: jest.fn(async () => null),
			findById: jest.fn(async () => null),
			count: jest.fn(async () => 0),
			populate: jest.fn(async (document: any) => document),
			toJSON: jest.fn((document: any) => document),
			resolveVirtuals: jest.fn(async (document: any) => document)
		};
		BackendRegistry.register('testCollection', mockBackend);
	});

	afterEach(() => {
		BackendRegistry.clear();
	});

	it('should be defined', () => {
		expect(storeFactory).toBeDefined();
		expect(typeof storeFactory).toBe('function');
	});

	it('should return CollectionStore for "many" scope', () => {
		const result: AStore = storeFactory('many', 'testCollection', 'testTarget');

		expect(result).toBeInstanceOf(CollectionStore);
		expect((result as any)._backend).toBe(mockBackend);
		expect(result.target).toBe('testTarget');
	});

	it('should return CountStore for "count" scope', () => {
		const result: AStore = storeFactory('count', 'testCollection', 'testTarget');

		expect(result).toBeInstanceOf(CountStore);
		expect((result as any)._backend).toBe(mockBackend);
		expect(result.target).toBe('testTarget');
	});

	it('should return DocumentStore for "one" scope', () => {
		const result: AStore = storeFactory('one', 'testCollection', 'testTarget');

		expect(result).toBeInstanceOf(DocumentStore);
		expect((result as any)._backend).toBe(mockBackend);
		expect(result.target).toBe('testTarget');
	});

	it('should default to DocumentStore for unknown scopes', () => {
		const result: AStore = storeFactory('invalid' as any, 'testCollection', 'testTarget');

		expect(result).toBeInstanceOf(DocumentStore);
	});

	it('should resolve the backend through the BackendRegistry', () => {
		const otherBackend: IObservableBackend = {...mockBackend, target: jest.fn(() => 'other')};
		BackendRegistry.register('other', otherBackend);

		const result: AStore = storeFactory('many', 'other', 'otherTarget');

		expect((result as any)._backend).toBe(otherBackend);
	});

	it('should pass a null backend for unregistered observe keys', () => {
		const result: AStore = storeFactory('one', 'unregistered', 'testTarget');

		expect(result).toBeInstanceOf(DocumentStore);
		expect((result as any)._backend).toBeNull();
	});
});
