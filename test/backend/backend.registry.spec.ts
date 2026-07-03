'use strict';

import {Subject} from 'rxjs';

import BackendRegistry from '../../src/backend/backend.registry';
import IObservableBackend from '../../src/backend/i.observable.backend';

const createBackend = (target: string): IObservableBackend => ({
	target: jest.fn(() => target),
	changes: jest.fn(() => new Subject<any>()),
	find: jest.fn(async () => []),
	findOne: jest.fn(async () => null),
	findById: jest.fn(async () => null),
	count: jest.fn(async () => 0),
	populate: jest.fn(async (document: any) => document),
	toJSON: jest.fn((document: any) => document),
	resolveVirtuals: jest.fn(async (document: any) => document)
});

describe('backend.registry tests', () => {
	beforeEach(() => {
		BackendRegistry.clear();
	});

	afterEach(() => {
		BackendRegistry.clear();
	});

	it('registers and retrieves a backend', () => {
		const backend: IObservableBackend = createBackend('users');
		BackendRegistry.register('users', backend);

		expect(BackendRegistry.get('users')).toBe(backend);
		expect(BackendRegistry.has('users')).toBe(true);
		expect(BackendRegistry.keys()).toEqual(['users']);
	});

	it('returns null for a missing backend', () => {
		expect(BackendRegistry.get('missing')).toBeNull();
		expect(BackendRegistry.has('missing')).toBe(false);
		expect(BackendRegistry.keys()).toEqual([]);
	});

	it('warns when overwriting an existing registration', () => {
		const warnSpy: jest.SpyInstance = jest.spyOn(console, 'warn').mockImplementation();
		const first: IObservableBackend = createBackend('users');
		const second: IObservableBackend = createBackend('users');
		try {
			BackendRegistry.register('users', first);
			expect(warnSpy).not.toHaveBeenCalled();

			BackendRegistry.register('users', second);
			expect(warnSpy).toHaveBeenCalledWith('[@owservable/core] -> BackendRegistry: overwriting backend registration for "users"');
			expect(BackendRegistry.get('users')).toBe(second);
			expect(BackendRegistry.keys()).toEqual(['users']);
		} finally {
			warnSpy.mockRestore();
		}
	});

	it('is a static registry whose constructor produces a plain instance', () => {
		const instance: any = new (BackendRegistry as any)();
		expect(instance).toBeInstanceOf(BackendRegistry);
	});

	it('clears all registrations', () => {
		BackendRegistry.register('a', createBackend('a'));
		BackendRegistry.register('b', createBackend('b'));
		expect(BackendRegistry.keys()).toEqual(['a', 'b']);

		BackendRegistry.clear();

		expect(BackendRegistry.keys()).toEqual([]);
		expect(BackendRegistry.has('a')).toBe(false);
		expect(BackendRegistry.get('b')).toBeNull();
	});
});
