'use strict';

import CollectionStore from '../../src/store/collection.store';
import EStoreType from '../../src/enums/store.type.enum';
import IObservableBackend from '../../src/backend/i.observable.backend';

describe('collection.store tests', () => {
	let mockBackend: jest.Mocked<IObservableBackend>;
	let mockStore: CollectionStore;

	beforeEach(() => {
		mockBackend = {
			target: jest.fn(() => 'testCollection'),
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

		mockStore = new CollectionStore(mockBackend, 'testCollection');
	});

	afterEach(() => {
		(mockStore as any).delaySendCount?.cancel?.();
	});

	describe('constructor', () => {
		it('should initialize with correct default values', () => {
			expect(mockStore.target).toBe('testCollection');
			expect((mockStore as any)._type).toBe(EStoreType.COLLECTION);
			expect((mockStore as any)._totalCount).toBe(-1);
			expect(Object.getPrototypeOf(mockStore)).toBe(CollectionStore.prototype);
		});
	});

	describe('shouldReload', () => {
		beforeEach(() => {
			jest.spyOn(mockStore as any, 'restartSubscription').mockImplementation();
			mockStore.config = {
				query: {status: 'active'},
				strict: false,
				incremental: false
			} as any;
		});

		it('should return true for initial subscription', () => {
			expect((mockStore as any).shouldReload({})).toBe(true);
		});

		it('should return true if no updateDescription', () => {
			expect((mockStore as any).shouldReload({operationType: 'update'})).toBe(true);
		});

		it('should return true if query fields are updated', () => {
			const change: any = {
				operationType: 'update',
				updateDescription: {
					updatedFields: {status: 'inactive'},
					removedFields: []
				}
			};
			expect((mockStore as any).shouldReload(change)).toBe(true);
		});

		it('should return true for delete operation', () => {
			const change: any = {
				operationType: 'delete',
				updateDescription: {updatedFields: {}, removedFields: []}
			};
			expect((mockStore as any).shouldReload(change)).toBe(true);
		});

		it('should return true for insert operation', () => {
			const change: any = {
				operationType: 'insert',
				updateDescription: {updatedFields: {}, removedFields: []}
			};
			expect((mockStore as any).shouldReload(change)).toBe(true);
		});

		it('should use testDocument for update when not considering fields', () => {
			const change: any = {
				operationType: 'update',
				updateDescription: {
					updatedFields: {name: 'test'},
					removedFields: []
				},
				fullDocument: {status: 'active'}
			};
			expect((mockStore as any).shouldReload(change)).toBe(true);
		});

		it('should return false via testDocument for a non-matching document', () => {
			const change: any = {
				operationType: 'update',
				updateDescription: {
					updatedFields: {name: 'test'},
					removedFields: []
				},
				fullDocument: {status: 'inactive'}
			};
			expect((mockStore as any).shouldReload(change)).toBe(false);
		});

		it('should return false for unknown operation types', () => {
			const change: any = {
				operationType: 'drop',
				updateDescription: {updatedFields: {}, removedFields: []}
			};
			expect((mockStore as any).shouldReload(change)).toBe(false);
		});

		it('should return true for replace when field projection intersects updated fields', () => {
			(mockStore as any)._fields = {title: 1};
			const change: any = {
				operationType: 'replace',
				updateDescription: {
					updatedFields: {title: 't'},
					removedFields: []
				},
				fullDocument: {}
			};
			expect((mockStore as any).shouldReload(change)).toBe(true);
		});

		it('should return false for replace when field projection does not intersect', () => {
			(mockStore as any)._fields = {title: 1};
			const change: any = {
				operationType: 'replace',
				updateDescription: {
					updatedFields: {other: 'x'},
					removedFields: []
				},
				fullDocument: {}
			};
			expect((mockStore as any).shouldReload(change)).toBe(false);
		});
	});

	describe('sendCount', () => {
		it('should emit total count', async () => {
			const mockEmitTotal: jest.SpyInstance = jest.spyOn(mockStore as any, 'emitTotal').mockImplementation();
			mockBackend.count.mockResolvedValue(10);

			jest.spyOn(mockStore as any, 'restartSubscription').mockImplementation();
			mockStore.config = {query: {status: 'active'}, strict: false, incremental: false} as any;

			await (mockStore as any).sendCount('test-sub');

			expect(mockBackend.count).toHaveBeenCalledWith({status: 'active'});
			expect(mockEmitTotal).toHaveBeenCalledWith(expect.any(Number), 'test-sub', 10);
			expect((mockStore as any)._totalCount).toBe(10);
		});
	});

	describe('loadIncremental', () => {
		beforeEach(() => {
			jest.spyOn(mockStore as any, 'emitDelete').mockImplementation();
			jest.spyOn(mockStore as any, 'emitMany').mockImplementation();
			jest.spyOn(mockStore as any, 'restartSubscription').mockImplementation();
			mockStore.config = {
				query: {},
				strict: false,
				incremental: true,
				populates: [],
				virtuals: []
			} as any;
		});

		it('should emit delete for delete operation', async () => {
			const change: any = {
				operationType: 'delete',
				documentKey: {_id: 'test-id'}
			};

			await (mockStore as any).loadIncremental(1000, 'test-sub', change);

			expect((mockStore as any).emitDelete).toHaveBeenCalledWith(1000, 'test-sub', 'test-id');
		});

		it('should emit document for insert operations', async () => {
			const fullDocument: any = {_id: 'test-id', name: 'test'};
			const change: any = {
				operationType: 'insert',
				documentKey: {_id: 'test-id'},
				fullDocument
			};

			await (mockStore as any).loadIncremental(1000, 'test-sub', change);

			expect(mockBackend.populate).not.toHaveBeenCalled();
			expect(mockBackend.resolveVirtuals).not.toHaveBeenCalled();
			expect((mockStore as any).emitMany).toHaveBeenCalledWith(1000, 'test-sub', {data: fullDocument});
		});

		it('should populate the changed document per configured populate', async () => {
			const fullDocument: any = {_id: 'test-id', name: 'test'};
			const change: any = {
				operationType: 'insert',
				documentKey: {_id: 'test-id'},
				fullDocument
			};

			mockStore.config = {
				query: {},
				strict: false,
				incremental: true,
				populates: ['user', 'category'],
				virtuals: []
			} as any;

			await (mockStore as any).loadIncremental(1000, 'test-sub', change);

			expect(mockBackend.populate).toHaveBeenCalledWith(fullDocument, 'user');
			expect(mockBackend.populate).toHaveBeenCalledWith(fullDocument, 'category');
		});

		it('should resolve virtuals when configured', async () => {
			const fullDocument: any = {_id: 'test-id', name: 'test'};
			const resolved: any = {_id: 'test-id', name: 'test', fullName: 'Test Full Name'};
			mockBackend.resolveVirtuals.mockResolvedValue(resolved);

			const change: any = {
				operationType: 'insert',
				documentKey: {_id: 'test-id'},
				fullDocument
			};

			mockStore.config = {
				query: {},
				strict: false,
				incremental: true,
				populates: [],
				virtuals: ['fullName']
			} as any;

			await (mockStore as any).loadIncremental(1000, 'test-sub', change);

			expect(mockBackend.resolveVirtuals).toHaveBeenCalledWith(fullDocument, ['fullName']);
			expect((mockStore as any).emitMany).toHaveBeenCalledWith(1000, 'test-sub', {data: resolved});
		});
	});

	describe('loadAll', () => {
		beforeEach(() => {
			jest.spyOn(mockStore as any, 'emitMany').mockImplementation();
			jest.spyOn(mockStore as any, 'emitTotal').mockImplementation();
			jest.spyOn(mockStore as any, 'restartSubscription').mockImplementation();
			mockStore.config = {
				query: {status: 'active'},
				fields: {name: 1},
				sort: {createdAt: -1},
				page: 1,
				pageSize: 10,
				strict: false,
				incremental: false,
				populates: ['user'],
				virtuals: []
			} as any;
			(mockStore as any).removeSubscriptionDiff('test-sub');
		});

		it('should load documents with a single backend find call', async () => {
			const documents: any[] = [
				{_id: '1', name: 'doc1'},
				{_id: '2', name: 'doc2'}
			];
			mockBackend.find.mockResolvedValue(documents);
			mockBackend.count.mockResolvedValue(2);
			(mockStore as any)._totalCount = 2;

			await (mockStore as any).loadAll(1000, 'test-sub');
			await new Promise((resolve) => setImmediate(resolve));

			expect(mockBackend.find).toHaveBeenCalledWith({status: 'active'}, {name: 1}, {skip: 0, limit: 10}, {createdAt: -1}, ['user']);
			expect((mockStore as any).emitMany).toHaveBeenCalledWith(1000, 'test-sub', {total: 2, data: documents});
			expect((mockStore as any).emitTotal).toHaveBeenCalledWith(expect.any(Number), 'test-sub', 2);
		});

		it('should handle query changes with recounting', async () => {
			const documents: any[] = [{_id: '1', name: 'doc1'}];
			mockBackend.find.mockResolvedValue(documents);
			mockBackend.count.mockResolvedValue(1);
			const sendCountSpy: jest.SpyInstance = jest.spyOn(mockStore as any, 'sendCount').mockImplementation();
			jest.spyOn(mockStore as any, 'isQueryChange').mockReturnValue(true);
			const removeDiffSpy: jest.SpyInstance = jest.spyOn(mockStore as any, 'removeSubscriptionDiff');
			(mockStore as any)._totalCount = 1;

			await (mockStore as any).loadAll(1000, 'test-sub');

			expect((mockStore as any).emitMany).toHaveBeenCalledWith(1000, 'test-sub', {total: 1, data: documents, recounting: true});
			expect(sendCountSpy).toHaveBeenCalledWith('test-sub');
			expect(removeDiffSpy).toHaveBeenCalledWith('test-sub');
		});

		it('should resolve virtuals for every document when configured', async () => {
			const documents: any[] = [
				{_id: '1', name: 'doc1'},
				{_id: '2', name: 'doc2'}
			];
			mockBackend.find.mockResolvedValue(documents);
			mockBackend.count.mockResolvedValue(2);
			mockBackend.resolveVirtuals.mockImplementation(async (document: any) => ({...document, fullName: 'resolved'}));

			mockStore.config = {
				query: {},
				strict: false,
				incremental: false,
				populates: [],
				virtuals: ['fullName']
			} as any;

			await (mockStore as any).loadAll(1000, 'test-sub');

			expect(mockBackend.resolveVirtuals).toHaveBeenCalledTimes(2);
			expect((mockStore as any).emitMany).toHaveBeenCalledWith(1000, 'test-sub', {
				total: -1,
				data: [
					{_id: '1', name: 'doc1', fullName: 'resolved'},
					{_id: '2', name: 'doc2', fullName: 'resolved'}
				]
			});
		});
	});

	describe('load', () => {
		beforeEach(() => {
			jest.spyOn(mockStore as any, 'emitMany').mockImplementation();
			jest.spyOn(mockStore as any, 'emitError').mockImplementation();
			jest.spyOn(mockStore as any, 'shouldReload').mockReturnValue(true);
			jest.spyOn(mockStore as any, 'loadIncremental').mockImplementation();
			jest.spyOn(mockStore as any, 'loadAll').mockImplementation();
			jest.spyOn(mockStore as any, 'restartSubscription').mockImplementation();
			mockStore.config = {
				query: {},
				strict: false,
				incremental: false
			} as any;
		});

		it('should emit empty if no config', async () => {
			(mockStore as any)._config = {};
			(mockStore as any)._subscriptionId = 'test-sub';

			await (mockStore as any).load({});

			expect((mockStore as any).emitMany).toHaveBeenCalledWith(expect.any(Number), 'test-sub');
		});

		it('should return early if should not reload', async () => {
			jest.spyOn(mockStore as any, 'shouldReload').mockReturnValue(false);
			((mockStore as any).loadIncremental as jest.Mock).mockClear();
			((mockStore as any).loadAll as jest.Mock).mockClear();

			await (mockStore as any).load({});

			expect((mockStore as any).loadIncremental).not.toHaveBeenCalled();
			expect((mockStore as any).loadAll).not.toHaveBeenCalled();
		});

		it('should call loadIncremental for incremental updates', async () => {
			const change: any = {fullDocument: {_id: 'test'}};
			(mockStore as any)._incremental = true;

			await (mockStore as any).load(change);

			expect((mockStore as any).loadIncremental).toHaveBeenCalledWith(expect.any(Number), expect.any(String), change);
		});

		it('should call loadAll for non-incremental updates', async () => {
			const change: any = {fullDocument: {_id: 'test'}};
			(mockStore as any)._incremental = false;

			await (mockStore as any).load(change);

			expect((mockStore as any).loadAll).toHaveBeenCalledWith(expect.any(Number), expect.any(String));
		});

		it('should call loadAll when incremental but change has no fullDocument', async () => {
			(mockStore as any)._incremental = true;

			await (mockStore as any).load({operationType: 'insert'});

			expect((mockStore as any).loadAll).toHaveBeenCalledWith(expect.any(Number), expect.any(String));
			expect((mockStore as any).loadIncremental).not.toHaveBeenCalled();
		});

		it('should handle errors', async () => {
			const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'error').mockImplementation();
			const error: Error = new Error('Test error');
			jest.spyOn(mockStore as any, 'loadAll').mockRejectedValue(error);
			try {
				await (mockStore as any).load({});

				expect(consoleSpy).toHaveBeenCalled();
				expect(consoleSpy.mock.calls[0][0]).toContain('[@owservable/core] -> CollectionStore::load Error:');
				expect((mockStore as any).emitError).toHaveBeenCalledWith(expect.any(Number), expect.any(String), error);
			} finally {
				consoleSpy.mockRestore();
			}
		});
	});

	describe('extractFromConfig', () => {
		beforeEach(() => {
			jest.spyOn(mockStore as any, 'restartSubscription').mockImplementation();
		});

		it('should extract incremental and paging configuration', () => {
			mockStore.config = {
				query: {},
				strict: false,
				incremental: true,
				page: 2,
				pageSize: 20
			} as any;

			expect((mockStore as any)._incremental).toBe(true);
			expect((mockStore as any)._paging).toEqual({skip: 20, limit: 20});
		});

		it('should handle no paging', () => {
			mockStore.config = {
				query: {},
				strict: false,
				incremental: false
			} as any;

			expect((mockStore as any)._paging).toEqual({});
		});

		it('should default page to 1 when pageSize is provided', () => {
			mockStore.config = {
				query: {},
				strict: false,
				incremental: false,
				pageSize: 15
			} as any;

			expect((mockStore as any)._paging).toEqual({skip: 0, limit: 15});
		});

		it('should default incremental when key is omitted', () => {
			mockStore.config = {
				query: {p: 1},
				strict: false,
				pageSize: 11
			} as any;

			expect((mockStore as any)._incremental).toBe(false);
			expect((mockStore as any)._paging).toEqual({skip: 0, limit: 11});
		});
	});
});
