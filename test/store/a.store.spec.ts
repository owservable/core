'use strict';

import * as _ from 'lodash';
import {Subscription} from 'rxjs';

import AStore from '../../src/store/a.store';
import EStoreType from '../../src/enums/store.type.enum';
import IObservableBackend from '../../src/backend/i.observable.backend';

class TestStore extends AStore {
	constructor(backend: IObservableBackend, target: string) {
		super(backend, target);
		this._type = EStoreType.COLLECTION;
	}

	protected shouldReload(change: any): boolean {
		return this.isInitialSubscription(change) || !_.isEmpty(change);
	}

	protected async load(_change: any): Promise<void> {
		return Promise.resolve();
	}

	protected extractFromConfig(): void {
		super.extractFromConfig();
		const {incremental = false} = this._config;
		this._incremental = incremental;
	}

	public testIsInitialSubscription(change: any): boolean {
		return this.isInitialSubscription(change);
	}

	public testExtractFromConfig(): void {
		return this.extractFromConfig();
	}

	public testTestDocument(document: any): boolean {
		return this.testDocument(document);
	}

	public testEmitOne(startTime: number, subscriptionId: string, update: any = {}): void {
		return this.emitOne(startTime, subscriptionId, update);
	}

	public testEmitMany(startTime: number, subscriptionId: string, update?: any): void {
		return this.emitMany(startTime, subscriptionId, update);
	}

	public testEmitTotal(startTime: number, subscriptionId: string, total: any): void {
		return this.emitTotal(startTime, subscriptionId, total);
	}

	public testEmitDelete(startTime: number, subscriptionId: string, deleted: any): void {
		return this.emitDelete(startTime, subscriptionId, deleted);
	}

	public testEmitError(startTime: number, subscriptionId: string, error: any): void {
		return this.emitError(startTime, subscriptionId, error);
	}

	public testShouldConsiderFields(): boolean {
		return this.shouldConsiderFields();
	}

	public testRemoveSubscriptionDiff(subId: string): void {
		return this.removeSubscriptionDiff(subId);
	}

	public testIsQueryChange(subId: string): boolean {
		return this.isQueryChange(subId);
	}

	public getBackend(): IObservableBackend {
		return this.backend;
	}

	public setSubscription(subscription: Subscription): void {
		this.subscription = subscription;
	}

	public getSubscriptionId(): string {
		return this._subscriptionId;
	}

	public getQuery(): any {
		return this._query;
	}

	public getFields(): any {
		return this._fields;
	}

	public getDelay(): number {
		return this._delay;
	}

	public getSubscriptionDiffs(): Map<string, boolean> {
		return this._subscriptionDiffs;
	}

	public getIncremental(): boolean {
		return this._incremental;
	}
}

describe('a.store tests', () => {
	let mockBackend: jest.Mocked<IObservableBackend>;
	let mockStore: TestStore;
	let mockSubscription: any;
	let handlers: any;
	let fakeObservable: any;

	beforeEach(() => {
		mockSubscription = {
			unsubscribe: jest.fn()
		};

		fakeObservable = {
			pipe: jest.fn().mockReturnThis(),
			subscribe: jest.fn((h: any) => {
				handlers = h;
				return mockSubscription;
			})
		};

		mockBackend = {
			target: jest.fn(() => 'testTarget'),
			changes: jest.fn(() => fakeObservable),
			find: jest.fn(async () => []),
			findOne: jest.fn(async () => null),
			findById: jest.fn(async () => null),
			count: jest.fn(async () => 0),
			populate: jest.fn(async (document: any) => document),
			toJSON: jest.fn((document: any) => (document?.toJSON ? document.toJSON() : document)),
			resolveVirtuals: jest.fn(async (document: any) => document)
		} as any;

		mockStore = new TestStore(mockBackend, 'testTarget');
	});

	describe('constructor', () => {
		it('should initialize with correct default values', () => {
			expect(mockStore.getBackend()).toBe(mockBackend);
			expect(mockStore.target).toBe('testTarget');
			expect(mockStore.getQuery()).toEqual({});
			expect(mockStore.getFields()).toEqual({});
			expect(mockStore.getDelay()).toBe(100);
			expect(mockStore.getSubscriptionDiffs()).toBeInstanceOf(Map);
		});
	});

	describe('destroy', () => {
		it('should unsubscribe from subscription', () => {
			mockStore.setSubscription(mockSubscription);
			mockStore.destroy();
			expect(mockSubscription.unsubscribe).toHaveBeenCalledTimes(1);
		});

		it('should handle undefined subscription', () => {
			expect(() => mockStore.destroy()).not.toThrow();
		});
	});

	describe('restartSubscription', () => {
		it('should create a new subscription from backend changes', () => {
			mockStore.restartSubscription();
			expect(mockBackend.changes).toHaveBeenCalled();
			expect(fakeObservable.subscribe).toHaveBeenCalled();
		});

		it('should destroy existing subscription before creating new one', () => {
			mockStore.setSubscription(mockSubscription);
			mockStore.restartSubscription();
			expect(mockSubscription.unsubscribe).toHaveBeenCalledTimes(1);
		});

		it('should forward stream error and completion', () => {
			const errSpy: jest.SpyInstance = jest.spyOn(mockStore as any, 'error').mockImplementation();
			const completeSpy: jest.SpyInstance = jest.spyOn(mockStore as any, 'complete').mockImplementation();
			try {
				mockStore.restartSubscription();
				handlers.error(new Error('stream-fail'));
				handlers.complete();
				expect(errSpy).toHaveBeenCalledWith(new Error('stream-fail'));
				expect(completeSpy).toHaveBeenCalled();
			} finally {
				errSpy.mockRestore();
				completeSpy.mockRestore();
			}
		});

		it('should process stream next event', async () => {
			const loadSpy: jest.SpyInstance = jest.spyOn(mockStore as any, 'load').mockResolvedValue(undefined);
			try {
				mockStore.restartSubscription();
				const change: any = {operationType: 'update', documentKey: {_id: 'abc'}};
				handlers.next(change);
				await Promise.resolve();
				expect(loadSpy).toHaveBeenCalledWith(change);
			} finally {
				loadSpy.mockRestore();
			}
		});

		it('should forward rejected load from stream next to error()', async () => {
			const failure: Error = new Error('load-reject');
			const loadSpy: jest.SpyInstance = jest.spyOn(mockStore as any, 'load').mockImplementation((change: any): Promise<void> => {
				if (_.isEmpty(change)) return Promise.resolve();
				return Promise.reject(failure);
			});
			const errorSpy: jest.SpyInstance = jest.spyOn(mockStore as any, 'error').mockImplementation();
			try {
				mockStore.restartSubscription();
				handlers.next({operationType: 'update'});
				await Promise.resolve();
				await Promise.resolve();
				expect(loadSpy).toHaveBeenCalled();
				expect(errorSpy).toHaveBeenCalledWith(failure);
			} finally {
				loadSpy.mockRestore();
				errorSpy.mockRestore();
			}
		});
	});

	describe('isInitialSubscription', () => {
		it('should return true for empty change', () => {
			expect(mockStore.testIsInitialSubscription({})).toBe(true);
		});

		it('should return false for non-empty change', () => {
			expect(mockStore.testIsInitialSubscription({operationType: 'insert'})).toBe(false);
		});
	});

	describe('extractFromConfig', () => {
		it('should extract configuration values', () => {
			mockStore.config = {
				subscriptionId: 'test-sub-123',
				query: {name: 'test'},
				sort: {createdAt: -1},
				fields: {name: 1, email: 1},
				populates: ['user'],
				virtuals: ['fullName'],
				delay: 200,
				strict: false,
				incremental: false
			} as any;

			expect(mockStore.getSubscriptionId()).toBe('test-sub-123');
			expect(mockStore.getQuery()).toEqual({name: 'test'});
			expect(mockStore.getFields()).toEqual({name: 1, email: 1});
			expect(mockStore.getDelay()).toBe(200);
			expect((mockStore as any)._populates).toEqual(['user']);
			expect((mockStore as any)._virtuals).toEqual(['fullName']);
		});

		it('should handle fields as array', () => {
			mockStore.config = {
				query: {},
				fields: ['name', 'email', 'createdAt'],
				strict: false,
				incremental: false
			} as any;

			expect(mockStore.getFields()).toEqual({name: 1, email: 1, createdAt: 1});
		});

		it('should use default values when not provided', () => {
			mockStore.config = {
				query: {},
				strict: false,
				incremental: false
			} as any;

			expect(mockStore.getSubscriptionId()).toBeDefined();
			expect(mockStore.getQuery()).toEqual({});
			expect(mockStore.getFields()).toEqual({});
			expect(mockStore.getDelay()).toBe(100);
		});

		it('should assign subscriptionId from randomUUID when missing on config', () => {
			(mockStore as any)._config = {
				query: {},
				strict: false,
				incremental: false
			};
			mockStore.testExtractFromConfig();
			expect(mockStore.getSubscriptionId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
		});

		it('should use default query and sort when omitted in config', () => {
			mockStore.config = {query: {a: 1}, sort: {createdAt: -1}, strict: false, incremental: false} as any;
			mockStore.config = {strict: false, incremental: false} as any;

			expect((mockStore as any)._query).toEqual({});
			expect((mockStore as any)._sort).toEqual({});
			expect((mockStore as any)._populates).toEqual([]);
			expect((mockStore as any)._virtuals).toEqual([]);
		});
	});

	describe('testDocument', () => {
		it('should return true for matching document', () => {
			mockStore.config = {query: {status: 'active'}, strict: false, incremental: false} as any;
			expect(mockStore.testTestDocument({status: 'active', name: 'test'})).toBe(true);
		});

		it('should return false for non-matching document', () => {
			mockStore.config = {query: {status: 'active'}, strict: false, incremental: false} as any;
			expect(mockStore.testTestDocument({status: 'inactive', name: 'test'})).toBe(false);
		});

		it('should return true on error', () => {
			const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'error').mockImplementation();
			try {
				mockStore.config = {query: {$invalid: 'invalid-query'}, strict: false, incremental: false} as any;
				expect(mockStore.testTestDocument({name: 'test'})).toBe(true);
				expect(consoleSpy).toHaveBeenCalled();
				expect(consoleSpy.mock.calls[0][0]).toContain('[@owservable/core] -> AStore::testDocument Error:');
			} finally {
				consoleSpy.mockRestore();
			}
		});
	});

	describe('_responseStatistics', () => {
		it('returns empty object and logs when JSON.stringify fails', () => {
			const nextSpy: jest.SpyInstance = jest.spyOn(mockStore, 'next').mockImplementation();
			const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'error').mockImplementation();
			mockStore.config = {subscriptionId: 'test-sub', query: {}, strict: false, incremental: false} as any;
			(mockStore as any)._query = {x: BigInt(1)};
			try {
				mockStore.testEmitOne(999, 'test-sub', {x: 1});
				expect(nextSpy).toHaveBeenCalled();
				const payload: any = nextSpy.mock.calls[nextSpy.mock.calls.length - 1][0];
				expect(payload.payload.testTarget).toEqual({x: 1});
				expect(consoleSpy).toHaveBeenCalled();
				expect(consoleSpy.mock.calls[0][0]).toContain('AStore::responseStatistics');
			} finally {
				nextSpy.mockRestore();
				consoleSpy.mockRestore();
				(mockStore as any)._query = {};
			}
		});
	});

	describe('emit methods', () => {
		beforeEach(() => {
			jest.spyOn(mockStore, 'next').mockImplementation();
			mockStore.config = {subscriptionId: 'test-sub', query: {}, strict: false, incremental: false} as any;
		});

		describe('emitOne', () => {
			it('should emit single update', () => {
				const update: any = {name: 'test'};
				mockStore.testEmitOne(1000, 'test-sub', update);

				expect(mockStore.next).toHaveBeenCalledWith(
					expect.objectContaining({
						subscriptionId: 'test-sub',
						type: 'update',
						target: 'testTarget',
						payload: {testTarget: update},
						execution_time: expect.stringMatching(/ms$/)
					})
				);
			});

			it('should emit with incremental type', () => {
				mockStore.config = {subscriptionId: 'test-sub', query: {}, strict: false, incremental: true} as any;
				expect(mockStore.getIncremental()).toBe(true);

				mockStore.testEmitOne(1000, 'test-sub', {});

				expect(mockStore.next).toHaveBeenCalledWith(expect.objectContaining({type: 'increment'}));
			});
		});

		describe('emitMany', () => {
			it('should emit multiple updates', () => {
				const update: any = {total: 5, data: [{name: 'test1'}, {name: 'test2'}], recounting: false};
				mockStore.testEmitMany(1000, 'test-sub', update);

				expect(mockStore.next).toHaveBeenCalledWith(
					expect.objectContaining({
						subscriptionId: 'test-sub',
						type: 'update',
						target: 'testTarget',
						payload: {
							testTarget: update.data,
							_testTargetCount: 5
						}
					})
				);
			});

			it('should include recounting flag', () => {
				mockStore.testEmitMany(1000, 'test-sub', {total: 5, data: [], recounting: true});

				expect(mockStore.next).toHaveBeenCalledWith(
					expect.objectContaining({
						payload: expect.objectContaining({_testTargetRecounting: true})
					})
				);
			});

			it('should not include count for incremental updates', () => {
				mockStore.config = {subscriptionId: 'test-sub', query: {}, strict: false, incremental: true} as any;
				mockStore.testEmitMany(1000, 'test-sub', {total: 5, data: [], recounting: false});

				expect(mockStore.next).toHaveBeenCalledWith(
					expect.objectContaining({
						payload: expect.not.objectContaining({_testTargetCount: expect.anything()})
					})
				);
			});

			it('should use default update object when omitted', () => {
				mockStore.testEmitMany(1000, 'test-sub');

				expect(mockStore.next).toHaveBeenCalledWith(
					expect.objectContaining({
						payload: expect.objectContaining({
							testTarget: [],
							_testTargetCount: 0
						})
					})
				);
			});

			it('should omit count when total is negative', () => {
				mockStore.testEmitMany(1000, 'test-sub', {total: -1, data: [], recounting: false});

				expect(mockStore.next).toHaveBeenCalledWith(
					expect.objectContaining({
						payload: expect.not.objectContaining({_testTargetCount: expect.anything()})
					})
				);
			});
		});

		describe('emitTotal', () => {
			it('should emit total count', () => {
				mockStore.testEmitTotal(1000, 'test-sub', 10);

				expect(mockStore.next).toHaveBeenCalledWith(
					expect.objectContaining({
						subscriptionId: 'test-sub',
						type: 'total',
						target: 'testTarget',
						total: 10
					})
				);
			});
		});

		describe('emitDelete', () => {
			it('should emit delete event', () => {
				mockStore.testEmitDelete(1000, 'test-sub', 'deleted-id');

				expect(mockStore.next).toHaveBeenCalledWith(
					expect.objectContaining({
						subscriptionId: 'test-sub',
						type: 'delete',
						target: 'testTarget',
						payload: 'deleted-id'
					})
				);
			});
		});

		describe('emitError', () => {
			it('should emit error event', () => {
				const error: Error = new Error('Test error');
				mockStore.testEmitError(1000, 'test-sub', error);

				expect(mockStore.next).toHaveBeenCalledWith(
					expect.objectContaining({
						subscriptionId: 'test-sub',
						type: 'error',
						error,
						target: 'testTarget'
					})
				);
			});
		});
	});

	describe('shouldConsiderFields', () => {
		it('should return true when fields are not empty and no zero values', () => {
			(mockStore as any)._fields = {name: 1, email: 1};
			expect(mockStore.testShouldConsiderFields()).toBe(true);
		});

		it('should return false when fields are empty', () => {
			(mockStore as any)._fields = {};
			expect(mockStore.testShouldConsiderFields()).toBe(false);
		});

		it('should return false when fields contain zero values', () => {
			(mockStore as any)._fields = {name: 1, password: 0};
			expect(mockStore.testShouldConsiderFields()).toBe(false);
		});
	});

	describe('config setter', () => {
		it('should set and extract configuration', () => {
			mockStore.config = {
				subscriptionId: 'test-sub',
				query: {status: 'active'},
				sort: {createdAt: -1}
			} as any;

			expect(mockStore.getSubscriptionId()).toBe('test-sub');
			expect(mockStore.getQuery()).toEqual({status: 'active'});
			expect(mockBackend.changes).toHaveBeenCalled();
		});

		it('should generate subscriptionId if not provided', () => {
			mockStore.config = {query: {status: 'active'}} as any;

			expect(mockStore.getSubscriptionId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
		});

		it('should ignore a nullish config', () => {
			const restartSpy: jest.SpyInstance = jest.spyOn(mockStore, 'restartSubscription').mockImplementation();
			try {
				mockStore.config = null as any;
				expect(restartSpy).not.toHaveBeenCalled();
			} finally {
				restartSpy.mockRestore();
			}
		});

		it('should ignore an identical config', () => {
			const restartSpy: jest.SpyInstance = jest.spyOn(mockStore, 'restartSubscription').mockImplementation();
			try {
				const config: any = {subscriptionId: 's1', query: {a: 1}, strict: false, incremental: false};
				mockStore.config = config;
				expect(restartSpy).toHaveBeenCalledTimes(1);

				mockStore.config = _.cloneDeep(config);
				expect(restartSpy).toHaveBeenCalledTimes(1);
			} finally {
				restartSpy.mockRestore();
			}
		});

		it('should skip query diff tracking for non-collection stores', () => {
			(mockStore as any)._type = EStoreType.DOCUMENT;
			mockStore.config = {subscriptionId: 'doc-sub', query: {status: 'active'}} as any;

			expect(mockStore.getSubscriptionDiffs().size).toBe(0);
			expect(mockStore.testIsQueryChange('doc-sub')).toBe(false);
		});

		it('should record an empty query diff when only non-query settings change', () => {
			mockStore.config = {subscriptionId: 's1', query: {a: 1}, strict: false, incremental: false} as any;
			expect(mockStore.testIsQueryChange('s1')).toBe(true);

			mockStore.config = {subscriptionId: 's2', query: {a: 1}, delay: 250, strict: false, incremental: false} as any;
			expect(mockStore.testIsQueryChange('s2')).toBe(false);
		});
	});

	describe('subscription diff management', () => {
		it('should add subscription diff', () => {
			mockStore.config = {subscriptionId: 'test-sub', query: {status: 'active'}} as any;
			expect(mockStore.testIsQueryChange('test-sub')).toBe(true);
		});

		it('should remove subscription diff', () => {
			mockStore.config = {subscriptionId: 'test-sub', query: {status: 'active'}} as any;
			mockStore.testRemoveSubscriptionDiff('test-sub');
			expect(mockStore.testIsQueryChange('test-sub')).toBe(false);
		});
	});

	describe('target getter', () => {
		it('should return target', () => {
			expect(mockStore.target).toBe('testTarget');
		});
	});
});
