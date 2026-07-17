'use strict';

import * as _ from 'lodash';
import {Subject} from 'rxjs';

import DocumentStore from '../../src/store/document.store';
import EStoreType from '../../src/enums/store.type.enum';
import IObservableBackend from '../../src/backend/i.observable.backend';

describe('document.store tests', () => {
	let mockBackend: jest.Mocked<IObservableBackend>;
	let mockStore: DocumentStore;
	let handlers: any;
	let fakeObservable: any;

	beforeEach(() => {
		fakeObservable = {
			pipe: jest.fn().mockReturnThis(),
			subscribe: jest.fn((h: any) => {
				handlers = h;
				return {unsubscribe: jest.fn()};
			})
		};

		mockBackend = {
			target: jest.fn(() => 'testDocument'),
			changes: jest.fn(() => fakeObservable),
			find: jest.fn(async () => []),
			findOne: jest.fn(async () => null),
			findById: jest.fn(async () => null),
			count: jest.fn(async () => 0),
			populate: jest.fn(async (document: any) => document),
			toJSON: jest.fn((document: any) => (document?.toJSON ? document.toJSON() : document)),
			resolveVirtuals: jest.fn(async (document: any) => document)
		} as any;

		mockStore = new DocumentStore(mockBackend, 'testDocument');
	});

	describe('constructor', () => {
		it('should initialize with correct default values', () => {
			expect(mockStore.target).toBe('testDocument');
			expect((mockStore as any)._type).toBe(EStoreType.DOCUMENT);
			expect(Object.getPrototypeOf(mockStore)).toBe(DocumentStore.prototype);
		});
	});

	describe('shouldReload', () => {
		beforeEach(() => {
			mockStore.config = {
				query: {_id: 'test-id'},
				strict: false,
				incremental: false
			} as any;
		});

		it('should return true for initial subscription', () => {
			expect((mockStore as any).shouldReload({})).toBe(true);
		});

		it('should return true for delete operation', () => {
			const change: any = {
				operationType: 'delete',
				documentKey: {_id: 'test-id'}
			};
			expect((mockStore as any).shouldReload(change)).toBe(true);
		});

		it('should return false for insert operation with ID query', () => {
			const change: any = {
				operationType: 'insert',
				documentKey: {_id: 'test-id'}
			};
			expect((mockStore as any).shouldReload(change)).toBe(false);
		});

		it('should return true for insert operation without ID query', () => {
			mockStore.config = {
				query: {name: 'test'},
				strict: false,
				incremental: false
			} as any;
			const change: any = {
				operationType: 'insert',
				documentKey: {_id: 'test-id'}
			};
			expect((mockStore as any).shouldReload(change)).toBe(true);
		});

		it('should return true if document key matches query ID', () => {
			const change: any = {
				operationType: 'update',
				documentKey: {_id: 'test-id'},
				updateDescription: {
					updatedFields: {name: 'updated'},
					removedFields: []
				}
			};
			expect((mockStore as any).shouldReload(change)).toBe(true);
		});

		it('should return true if no updateDescription and id does not match', () => {
			const change: any = {
				operationType: 'update',
				documentKey: {_id: 'different-id'}
			};
			expect((mockStore as any).shouldReload(change)).toBe(true);
		});

		it('should return true if should not consider fields', () => {
			jest.spyOn(mockStore as any, 'shouldConsiderFields').mockReturnValue(false);
			const change: any = {
				operationType: 'update',
				documentKey: {_id: 'different-id'},
				updateDescription: {
					updatedFields: {name: 'updated'},
					removedFields: []
				}
			};
			expect((mockStore as any).shouldReload(change)).toBe(true);
		});

		it('should return true if field intersections exist', () => {
			mockStore.config = {
				query: {_id: 'test-id'},
				fields: {name: 1, email: 1},
				strict: false,
				incremental: false
			} as any;
			const change: any = {
				operationType: 'update',
				documentKey: {_id: 'different-id'},
				updateDescription: {
					updatedFields: {name: 'updated'},
					removedFields: []
				}
			};
			expect((mockStore as any).shouldReload(change)).toBe(true);
		});

		it('should return false if no field intersections', () => {
			mockStore.config = {
				query: {_id: 'test-id'},
				fields: {name: 1, email: 1},
				strict: false,
				incremental: false
			} as any;
			const change: any = {
				operationType: 'update',
				documentKey: {_id: 'different-id'},
				updateDescription: {
					updatedFields: {description: 'updated'},
					removedFields: []
				}
			};
			expect((mockStore as any).shouldReload(change)).toBe(false);
		});

		it('should return false for unknown operation types', () => {
			const change: any = {
				operationType: 'rename',
				documentKey: {_id: 'test-id'}
			};
			expect((mockStore as any).shouldReload(change)).toBe(false);
		});

		it('should handle replace like update when id matches', () => {
			const change: any = {
				operationType: 'replace',
				documentKey: {_id: 'test-id'},
				updateDescription: {
					updatedFields: {name: 'n'},
					removedFields: []
				}
			};
			expect((mockStore as any).shouldReload(change)).toBe(true);
		});

		it('should handle string query ids via _getIdFromQuery', () => {
			mockStore.config = {
				query: 'string-id',
				strict: false,
				incremental: false
			} as any;
			const change: any = {
				operationType: 'insert',
				documentKey: {_id: 'x'}
			};
			expect((mockStore as any).shouldReload(change)).toBe(false);
		});

		it('should tolerate updateDescription without updatedFields', () => {
			mockStore.config = {
				query: {_id: 'test-id'},
				fields: {name: 1, email: 1},
				strict: false,
				incremental: false
			} as any;
			const change: any = {
				operationType: 'update',
				documentKey: {_id: 'different-id'},
				updateDescription: {removedFields: ['name']}
			};
			expect((mockStore as any).shouldReload(change)).toBe(true);
		});
	});

	describe('restartSubscription', () => {
		const bindHandlers = (): any => {
			mockStore.config = {
				query: {_id: 'id1'},
				fields: {n: 1},
				strict: false,
				incremental: false,
				populates: [],
				virtuals: []
			} as any;
			return handlers;
		};

		it('forwards stream error to error()', () => {
			const errSpy: jest.SpyInstance = jest.spyOn(mockStore as any, 'error').mockImplementation();
			try {
				const h: any = bindHandlers();
				h.error(new Error('pipe-err'));
				expect(errSpy).toHaveBeenCalledWith(new Error('pipe-err'));
			} finally {
				errSpy.mockRestore();
			}
		});

		it('forwards stream completion to complete()', () => {
			const completeSpy: jest.SpyInstance = jest.spyOn(mockStore as any, 'complete').mockImplementation();
			try {
				const h: any = bindHandlers();
				h.complete();
				expect(completeSpy).toHaveBeenCalled();
			} finally {
				completeSpy.mockRestore();
			}
		});

		it('handles stream next event', async () => {
			const loadSpy: jest.SpyInstance = jest.spyOn(mockStore as any, 'load').mockResolvedValue(undefined);
			try {
				const h: any = bindHandlers();
				const change: any = {operationType: 'update', documentKey: {_id: 'id1'}};
				h.next(change);
				await Promise.resolve();
				expect(loadSpy).toHaveBeenCalledWith(change);
			} finally {
				loadSpy.mockRestore();
			}
		});

		it('forwards rejected load from next() to error()', async () => {
			const failure: Error = new Error('next-load-fail');
			const loadSpy: jest.SpyInstance = jest.spyOn(mockStore as any, 'load').mockImplementation((change: any): Promise<void> => {
				if (_.isEmpty(change)) return Promise.resolve();
				return Promise.reject(failure);
			});
			const errorSpy: jest.SpyInstance = jest.spyOn(mockStore as any, 'error').mockImplementation();
			try {
				const h: any = bindHandlers();
				h.next({operationType: 'update'});
				await Promise.resolve();
				await Promise.resolve();
				expect(loadSpy).toHaveBeenCalled();
				expect(errorSpy).toHaveBeenCalledWith(failure);
			} finally {
				loadSpy.mockRestore();
				errorSpy.mockRestore();
			}
		});

		it('invokes filter pipeline when source emits', async () => {
			const subject: Subject<any> = new Subject<any>();
			mockBackend.changes.mockReturnValue(subject);
			const pipeFilterSpy: jest.SpyInstance = jest.spyOn(mockStore as any, '_pipeFilter');
			const loadSpy: jest.SpyInstance = jest.spyOn(mockStore as any, 'load').mockImplementation((): Promise<void> => Promise.resolve());
			try {
				mockStore.config = {
					query: {_id: 'id1'},
					fields: {n: 1},
					strict: false,
					incremental: false,
					populates: [],
					virtuals: [],
					delay: 0
				} as any;

				const change: any = {
					operationType: 'update',
					documentKey: {_id: 'id1'},
					updateDescription: {updatedFields: {}, removedFields: []}
				};

				subject.next(change);

				await new Promise<void>((resolve) => setImmediate(() => resolve()));

				expect(pipeFilterSpy).toHaveBeenCalledWith(change);
				expect(loadSpy).toHaveBeenCalledWith(change);
			} finally {
				mockStore.destroy();
				subject.complete();
				pipeFilterSpy.mockRestore();
				loadSpy.mockRestore();
			}
		});
	});

	describe('private loading methods', () => {
		beforeEach(() => {
			mockStore.config = {
				query: {_id: 'test-id'},
				fields: {name: 1},
				strict: false,
				incremental: false,
				populates: [],
				virtuals: []
			} as any;
		});

		it('should load document by ID', async () => {
			const document: any = {_id: 'test-id', name: 'test'};
			mockBackend.findById.mockResolvedValue(document);

			const result: any = await (mockStore as any)._loadDocumentById('test-id');

			expect(mockBackend.findById).toHaveBeenCalledWith('test-id', {name: 1}, []);
			expect(result).toBe(document);
		});

		it('should load document by query', async () => {
			const document: any = {_id: 'test-id', name: 'test'};
			mockBackend.findOne.mockResolvedValue(document);

			const result: any = await (mockStore as any)._loadDocument();

			expect(mockBackend.findOne).toHaveBeenCalledWith({_id: 'test-id'}, {name: 1}, []);
			expect(result).toBe(document);
		});

		it('should load sorted first document', async () => {
			const documents: any[] = [{_id: 'test-id', name: 'test'}];
			mockBackend.find.mockResolvedValue(documents);
			mockStore.config = {
				query: {status: 'active'},
				fields: {name: 1},
				sort: {createdAt: -1},
				strict: false,
				incremental: false,
				populates: [],
				virtuals: []
			} as any;

			const result: any = await (mockStore as any)._loadSortedFirstDocument();

			expect(mockBackend.find).toHaveBeenCalledWith({status: 'active'}, {name: 1}, {skip: 0, limit: 1}, {createdAt: -1}, []);
			expect(result).toBe(documents[0]);
		});
	});

	describe('_pipeFilter', () => {
		beforeEach(() => {
			mockStore.config = {
				query: {_id: 'test-id'},
				fields: {name: 1},
				strict: false,
				incremental: false,
				populates: [],
				virtuals: []
			} as any;
		});

		it('should return true for sorted queries', () => {
			mockStore.config = {
				query: {status: 'active'},
				sort: {createdAt: -1},
				strict: false,
				incremental: false
			} as any;

			expect((mockStore as any)._pipeFilter({operationType: 'update'})).toBe(true);
		});

		it('should return true for delete operations', () => {
			expect((mockStore as any)._pipeFilter({operationType: 'delete'})).toBe(true);
		});

		it('should return true if document key matches query ID', () => {
			const change: any = {
				operationType: 'update',
				documentKey: {_id: 'test-id'}
			};
			expect((mockStore as any)._pipeFilter(change)).toBe(true);
		});

		it('should return testDocument result for other cases', () => {
			const change: any = {
				operationType: 'update',
				documentKey: {_id: 'other-id'},
				fullDocument: {_id: 'other-id', name: 'test'}
			};
			jest.spyOn(mockStore as any, 'testDocument').mockReturnValue(true);

			expect((mockStore as any)._pipeFilter(change)).toBe(true);
			expect((mockStore as any).testDocument).toHaveBeenCalledWith({_id: 'other-id', name: 'test'});
		});
	});

	describe('load', () => {
		beforeEach(() => {
			jest.spyOn(mockStore as any, 'emitOne').mockImplementation();
			jest.spyOn(mockStore as any, 'emitDelete').mockImplementation();
			jest.spyOn(mockStore as any, 'emitError').mockImplementation();

			mockStore.config = {
				query: {_id: 'test-id'},
				fields: {name: 1},
				strict: false,
				incremental: false,
				populates: [],
				virtuals: []
			} as any;
		});

		it('should emit one if no config', async () => {
			(mockStore as any)._config = {};
			(mockStore as any)._subscriptionId = 'test-sub';

			await (mockStore as any).load({});

			expect((mockStore as any).emitOne).toHaveBeenCalledWith(expect.any(Number), 'test-sub');
		});

		it('should return early if should not reload', async () => {
			jest.spyOn(mockStore as any, 'shouldReload').mockReturnValue(false);
			await new Promise((resolve) => setImmediate(resolve));
			mockBackend.findById.mockClear();
			((mockStore as any).emitOne as jest.Mock).mockClear();

			await (mockStore as any).load({operationType: 'rename'});

			expect(mockBackend.findById).not.toHaveBeenCalled();
			expect((mockStore as any).emitOne).not.toHaveBeenCalled();
		});

		it('should emit delete for delete operation with matching ID', async () => {
			const change: any = {
				operationType: 'delete',
				documentKey: {_id: 'test-id'}
			};

			await (mockStore as any).load(change);

			expect((mockStore as any).emitDelete).toHaveBeenCalledWith(expect.any(Number), expect.any(String), 'test-id');
		});

		it('should reload for delete operation with a different ID', async () => {
			const document: any = {_id: 'test-id', name: 'test'};
			mockBackend.findById.mockResolvedValue(document);
			const change: any = {
				operationType: 'delete',
				documentKey: {_id: 'other-id'}
			};

			await (mockStore as any).load(change);

			expect((mockStore as any).emitDelete).not.toHaveBeenCalled();
			expect(mockBackend.findById).toHaveBeenCalledWith('test-id', {name: 1}, []);
			expect((mockStore as any).emitOne).toHaveBeenCalledWith(expect.any(Number), expect.any(String), document);
		});

		it('should load document with sort', async () => {
			const document: any = {_id: 'test-id', name: 'test'};
			mockBackend.find.mockResolvedValue([document]);
			mockStore.config = {
				query: {status: 'active'},
				sort: {createdAt: -1},
				fields: {name: 1},
				strict: false,
				incremental: false,
				populates: [],
				virtuals: []
			} as any;

			await (mockStore as any).load({});

			expect(mockBackend.find).toHaveBeenCalled();
			expect((mockStore as any).emitOne).toHaveBeenCalledWith(expect.any(Number), expect.any(String), document);
		});

		it('should load document by ID when query has _id', async () => {
			const document: any = {_id: 'test-id', name: 'test'};
			mockBackend.findById.mockResolvedValue(document);

			await (mockStore as any).load({});

			expect(mockBackend.findById).toHaveBeenCalledWith('test-id', {name: 1}, []);
			expect(mockBackend.toJSON).toHaveBeenCalledWith(document);
			expect((mockStore as any).emitOne).toHaveBeenCalledWith(expect.any(Number), expect.any(String), document);
		});

		it('should load document by query when no ID', async () => {
			const document: any = {_id: 'test-id', name: 'test'};
			mockBackend.findOne.mockResolvedValue(document);
			mockStore.config = {
				query: {status: 'active'},
				fields: {name: 1},
				strict: false,
				incremental: false,
				populates: [],
				virtuals: []
			} as any;

			await (mockStore as any).load({});

			expect(mockBackend.findOne).toHaveBeenCalledWith({status: 'active'}, {name: 1}, []);
			expect((mockStore as any).emitOne).toHaveBeenCalledWith(expect.any(Number), expect.any(String), document);
		});

		it('should populate the document per configured populate', async () => {
			const document: any = {_id: 'test-id', name: 'test'};
			mockBackend.findById.mockResolvedValue(document);
			mockStore.config = {
				query: {_id: 'test-id'},
				fields: {name: 1},
				strict: false,
				incremental: false,
				populates: ['user', 'category'],
				virtuals: []
			} as any;

			await (mockStore as any).load({});

			expect(mockBackend.populate).toHaveBeenCalledWith(document, 'user');
			expect(mockBackend.populate).toHaveBeenCalledWith(document, 'category');
			expect((mockStore as any).emitOne).toHaveBeenCalledWith(expect.any(Number), expect.any(String), document);
		});

		it('should resolve virtuals when configured', async () => {
			const document: any = {_id: 'test-id', name: 'test'};
			const resolved: any = {_id: 'test-id', name: 'test', fullName: 'Test Full Name'};
			mockBackend.findById.mockResolvedValue(document);
			mockBackend.resolveVirtuals.mockResolvedValue(resolved);
			mockStore.config = {
				query: {_id: 'test-id'},
				fields: {name: 1},
				strict: false,
				incremental: false,
				populates: [],
				virtuals: ['fullName']
			} as any;

			await (mockStore as any).load({});

			expect(mockBackend.resolveVirtuals).toHaveBeenCalledWith(document, ['fullName']);
			expect(mockBackend.toJSON).not.toHaveBeenCalled();
			expect((mockStore as any).emitOne).toHaveBeenCalledWith(expect.any(Number), expect.any(String), resolved);
		});

		it('should emit one with no data if nothing found', async () => {
			mockBackend.findById.mockResolvedValue(null);

			await (mockStore as any).load({});

			expect((mockStore as any).emitOne).toHaveBeenCalledWith(expect.any(Number), expect.any(String));
		});

		it('should handle errors', async () => {
			const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'error').mockImplementation();
			const error: Error = new Error('Test error');
			mockBackend.findById.mockRejectedValue(error);
			try {
				await (mockStore as any).load({});

				expect(consoleSpy).toHaveBeenCalled();
				expect(consoleSpy.mock.calls[0][0]).toContain('[@owservable/core] -> DocumentStore::load Error:');
				expect((mockStore as any).emitError).toHaveBeenCalledWith(expect.any(Number), expect.any(String), error);
			} finally {
				consoleSpy.mockRestore();
			}
		});
	});

	describe('extractFromConfig', () => {
		it('should reset paging when skip is provided', () => {
			mockStore.config = {
				query: {_id: 'test-id'},
				skip: 10,
				strict: false,
				incremental: false
			} as any;

			expect((mockStore as any)._paging).toEqual({});
		});

		it('should set paging to default when no skip', () => {
			mockStore.config = {
				query: {_id: 'test-id'},
				strict: false,
				incremental: false
			} as any;

			expect((mockStore as any)._paging).toEqual({skip: 0, limit: 1});
		});

		it('should handle skip value of 0', () => {
			mockStore.config = {
				query: {_id: 'test-id'},
				skip: 0,
				strict: false,
				incremental: false
			} as any;

			expect((mockStore as any)._paging).toEqual({skip: 0, limit: 1});
		});
	});
});
