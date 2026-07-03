'use strict';

import OwservableCore, {
	OwservableClient,
	EStoreType,
	BackendRegistry,
	initiateCronjobs,
	initiateWatchers,
	initiateWorkers,
	addActionCronjobs,
	addActionWatchers,
	addActionWorkers,
	executeCronjob,
	executeWatcher,
	executeWorker,
	executeProcessesInFolder,
	executeOnFilesRecursively,
	DataMiddlewareMap,
	AStore,
	CountStore,
	DocumentStore,
	CollectionStore,
	storeFactory
} from '../src/owservable.core';

describe('owservable.core tests', () => {
	it('exports an empty default object', () => {
		expect(OwservableCore).toBeDefined();
		expect(typeof OwservableCore).toBe('object');
		expect(OwservableCore).toEqual({});
		expect(Object.keys(OwservableCore)).toHaveLength(0);
	});

	it('exports the client and stores', () => {
		expect(OwservableClient).toBeDefined();
		expect(typeof OwservableClient).toBe('function');
		expect(AStore).toBeDefined();
		expect(CountStore).toBeDefined();
		expect(DocumentStore).toBeDefined();
		expect(CollectionStore).toBeDefined();
		expect(typeof storeFactory).toBe('function');
	});

	it('exports the backend registry and enums', () => {
		expect(BackendRegistry).toBeDefined();
		expect(typeof BackendRegistry.register).toBe('function');
		expect(EStoreType.DOCUMENT).toBe(0);
		expect(EStoreType.COLLECTION).toBe(1);
		expect(EStoreType.COUNT).toBe(2);
		expect(DataMiddlewareMap).toBeDefined();
	});

	it('exports the process functions', () => {
		expect(typeof initiateCronjobs).toBe('function');
		expect(typeof initiateWatchers).toBe('function');
		expect(typeof initiateWorkers).toBe('function');
		expect(typeof addActionCronjobs).toBe('function');
		expect(typeof addActionWatchers).toBe('function');
		expect(typeof addActionWorkers).toBe('function');
		expect(typeof executeCronjob).toBe('function');
		expect(typeof executeWatcher).toBe('function');
		expect(typeof executeWorker).toBe('function');
		expect(typeof executeProcessesInFolder).toBe('function');
		expect(typeof executeOnFilesRecursively).toBe('function');
	});
});
