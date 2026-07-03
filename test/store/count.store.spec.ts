'use strict';

import CountStore from '../../src/store/count.store';
import EStoreType from '../../src/enums/store.type.enum';
import IObservableBackend from '../../src/backend/i.observable.backend';

describe('count.store tests', () => {
	let mockBackend: jest.Mocked<IObservableBackend>;
	let mockStore: CountStore;

	beforeEach(() => {
		mockBackend = {
			target: jest.fn(() => 'test-target'),
			changes: jest.fn(() => ({
				pipe: jest.fn().mockReturnThis(),
				subscribe: jest.fn().mockReturnValue({unsubscribe: jest.fn()})
			})),
			find: jest.fn(async () => []),
			findOne: jest.fn(async () => null),
			findById: jest.fn(async () => null),
			count: jest.fn(async () => 0),
			populate: jest.fn(async (document: any) => document),
			toJSON: jest.fn((document: any) => document),
			resolveVirtuals: jest.fn(async (document: any) => document)
		} as any;

		mockStore = new CountStore(mockBackend, 'test-target');

		jest.spyOn(mockStore as any, 'emitOne').mockImplementation();
		jest.spyOn(mockStore as any, 'isInitialSubscription').mockReturnValue(false);

		(mockStore as any)._subscriptionId = 'test-sub-id';
		(mockStore as any)._query = {status: 'active'};
		(mockStore as any)._config = {query: {status: 'active'}};
	});

	describe('constructor', () => {
		it('should initialize with correct store type', () => {
			expect((mockStore as any)._type).toBe(EStoreType.COUNT);
		});

		it('should set correct prototype', () => {
			expect(Object.getPrototypeOf(mockStore)).toBe(CountStore.prototype);
		});

		it('should call parent constructor', () => {
			expect((mockStore as any)._backend).toBe(mockBackend);
			expect((mockStore as any)._target).toBe('test-target');
		});
	});

	describe('shouldReload', () => {
		it('should return true for initial subscription', () => {
			jest.spyOn(mockStore as any, 'isInitialSubscription').mockReturnValue(true);

			expect((mockStore as any).shouldReload({})).toBe(true);
		});

		it('should return true for delete operation', () => {
			expect((mockStore as any).shouldReload({operationType: 'delete'})).toBe(true);
		});

		it('should return true for insert operation', () => {
			expect((mockStore as any).shouldReload({operationType: 'insert'})).toBe(true);
		});

		it('should return false for replace operation', () => {
			expect((mockStore as any).shouldReload({operationType: 'replace'})).toBe(false);
		});

		it('should return false for update operation', () => {
			expect((mockStore as any).shouldReload({operationType: 'update'})).toBe(false);
		});

		it('should return false for unknown operation', () => {
			expect((mockStore as any).shouldReload({operationType: 'unknown'})).toBe(false);
		});

		it('should return false for no operation type', () => {
			expect((mockStore as any).shouldReload({})).toBe(false);
		});
	});

	describe('load', () => {
		it('should emit one with subscription ID when config is empty', async () => {
			(mockStore as any)._config = {};

			await (mockStore as any).load({});

			expect((mockStore as any).emitOne).toHaveBeenCalledWith(expect.any(Number), 'test-sub-id');
			expect(mockBackend.count).not.toHaveBeenCalled();
		});

		it('should return early if should not reload', async () => {
			jest.spyOn(mockStore as any, 'shouldReload').mockReturnValue(false);

			await (mockStore as any).load({});

			expect(mockBackend.count).not.toHaveBeenCalled();
			expect((mockStore as any).emitOne).not.toHaveBeenCalled();
		});

		it('should count documents and emit result', async () => {
			mockBackend.count.mockResolvedValue(42);
			jest.spyOn(mockStore as any, 'shouldReload').mockReturnValue(true);

			await (mockStore as any).load({});

			expect(mockBackend.count).toHaveBeenCalledWith({status: 'active'});
			expect((mockStore as any).emitOne).toHaveBeenCalledWith(expect.any(Number), 'test-sub-id', 42);
		});

		it('should handle count of zero', async () => {
			mockBackend.count.mockResolvedValue(0);
			jest.spyOn(mockStore as any, 'shouldReload').mockReturnValue(true);

			await (mockStore as any).load({});

			expect((mockStore as any).emitOne).toHaveBeenCalledWith(expect.any(Number), 'test-sub-id', 0);
		});

		it('should handle insert operation change', async () => {
			mockBackend.count.mockResolvedValue(10);

			await (mockStore as any).load({operationType: 'insert', fullDocument: {_id: 'new-doc'}});

			expect(mockBackend.count).toHaveBeenCalledWith({status: 'active'});
			expect((mockStore as any).emitOne).toHaveBeenCalledWith(expect.any(Number), 'test-sub-id', 10);
		});

		it('should handle delete operation change', async () => {
			mockBackend.count.mockResolvedValue(8);

			await (mockStore as any).load({operationType: 'delete', documentKey: {_id: 'deleted-doc'}});

			expect(mockBackend.count).toHaveBeenCalledWith({status: 'active'});
			expect((mockStore as any).emitOne).toHaveBeenCalledWith(expect.any(Number), 'test-sub-id', 8);
		});
	});
});
