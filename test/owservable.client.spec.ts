'use strict';

import OwservableClient from '../src/owservable.client';
import IConnectionManager from '../src/auth/i.connection.manager';
import storeFactory from '../src/store/factories/store.factory';
import DataMiddlewareMap from '../src/middleware/data.middleware.map';

jest.mock('../src/store/factories/store.factory');
jest.mock('../src/middleware/data.middleware.map', () => ({
	__esModule: true,
	default: {getMiddleware: jest.fn()}
}));

describe('owservable.client tests', () => {
	let mockConnectionManager: jest.Mocked<IConnectionManager>;
	let client: OwservableClient;
	let mockStore: any;
	let mockSubscription: any;
	let mockStoreFactory: jest.MockedFunction<typeof storeFactory>;
	let originalSetTimeout: typeof setTimeout;
	let originalClearTimeout: typeof clearTimeout;

	beforeEach(() => {
		originalSetTimeout = (global as any).setTimeout;
		originalClearTimeout = (global as any).clearTimeout;

		(global as any).setTimeout = jest.fn(() => 'timeout-id' as any);
		(global as any).clearTimeout = jest.fn();

		mockConnectionManager = {
			connected: jest.fn(),
			disconnected: jest.fn(),
			location: jest.fn(),
			ping: jest.fn(),
			checkSession: jest.fn(),
			user: {id: 'test-user'}
		} as any;

		mockSubscription = {
			unsubscribe: jest.fn()
		};

		mockStore = {
			config: null,
			subscribe: jest.fn().mockReturnValue(mockSubscription),
			destroy: jest.fn(),
			restartSubscription: jest.fn()
		};

		mockStoreFactory = storeFactory as jest.MockedFunction<typeof storeFactory>;
		mockStoreFactory.mockReturnValue(mockStore);

		client = new OwservableClient(mockConnectionManager);

		jest.spyOn(client, 'next').mockImplementation();
		jest.spyOn(client, 'error').mockImplementation();
		jest.spyOn(client, 'complete').mockImplementation();
	});

	afterEach(() => {
		(global as any).setTimeout = originalSetTimeout;
		(global as any).clearTimeout = originalClearTimeout;
	});

	describe('constructor', () => {
		it('should initialize with connection manager', () => {
			expect(client).toBeInstanceOf(OwservableClient);
			expect((client as any)._connectionManager).toBe(mockConnectionManager);
			expect((client as any)._stores).toBeInstanceOf(Map);
			expect((client as any)._subscriptions).toBeInstanceOf(Map);
		});
	});

	describe('disconnected', () => {
		it('should clear subscriptions and notify connection manager', () => {
			const mockClearSubscriptions: jest.SpyInstance = jest.spyOn(client as any, 'clearSubscriptions').mockImplementation();

			client.disconnected();

			expect(mockClearSubscriptions).toHaveBeenCalled();
			expect(mockConnectionManager.disconnected).toHaveBeenCalled();
			expect((global as any).clearTimeout).toHaveBeenCalled();
		});
	});

	describe('ping', () => {
		it('should send ping message and schedule next ping', () => {
			const originalDate: DateConstructor = Date;
			const mockDate: jest.Mock = jest.fn(() => ({getTime: () => 12345}));
			global.Date = mockDate as any;
			try {
				client.ping();

				expect(client.next).toHaveBeenCalledWith({type: 'ping', id: 12345});
				expect((global as any).setTimeout).toHaveBeenCalledWith(expect.any(Function), 60000);
			} finally {
				global.Date = originalDate;
			}
		});

		it('should run setTimeout callback registered by ping', () => {
			const setTimeoutMock: jest.Mock = (global as any).setTimeout as jest.Mock;
			client.ping();
			const scheduledPing: () => void = setTimeoutMock.mock.calls[0][0] as () => void;
			const pingSpy: jest.SpyInstance = jest.spyOn(client, 'ping').mockImplementation((): void => undefined);
			try {
				scheduledPing();
				expect(pingSpy).toHaveBeenCalledTimes(1);
			} finally {
				pingSpy.mockRestore();
			}
		});
	});

	describe('consume', () => {
		beforeEach(() => {
			jest.spyOn(client as any, '_processPong').mockImplementation();
			jest.spyOn(client as any, '_checkSession').mockImplementation();
			jest.spyOn(client as any, 'updateSubscription').mockImplementation();
			jest.spyOn(client as any, 'removeSubscription').mockImplementation();
			jest.spyOn(client as any, 'reloadData').mockImplementation();
		});

		it('should handle pong message', async () => {
			const message: any = {type: 'pong'};

			await client.consume(message);

			expect((client as any)._processPong).toHaveBeenCalledWith(message);
		});

		it('should handle authenticate message', async () => {
			await client.consume({type: 'authenticate', jwt: 'test-token'});

			expect(mockConnectionManager.connected).toHaveBeenCalledWith('test-token');
			expect((client as any)._checkSession).toHaveBeenCalled();
		});

		it('should handle location message', async () => {
			await client.consume({type: 'location', path: '/new/path'});

			expect(mockConnectionManager.location).toHaveBeenCalledWith('/new/path');
		});

		it('should handle subscribe message', async () => {
			const message: any = {type: 'subscribe', target: 'test-target'};

			await client.consume(message);

			expect((client as any).updateSubscription).toHaveBeenCalledWith(message);
		});

		it('should handle unsubscribe message', async () => {
			await client.consume({type: 'unsubscribe', target: 'test-target'});

			expect((client as any).removeSubscription).toHaveBeenCalledWith('test-target');
		});

		it('should handle reload message', async () => {
			await client.consume({type: 'reload', target: 'test-target'});

			expect((client as any).reloadData).toHaveBeenCalledWith('test-target');
		});

		it('should handle unknown message type gracefully', async () => {
			await expect(client.consume({type: 'unknown'})).resolves.toBeUndefined();
		});
	});

	describe('_processPong', () => {
		it('should calculate and update ping time', () => {
			const originalDate: DateConstructor = Date;
			const mockDate: jest.Mock = jest.fn(() => ({getTime: () => 67890}));
			global.Date = mockDate as any;
			try {
				(client as any)._processPong({id: 12345});

				expect(mockConnectionManager.ping).toHaveBeenCalledWith(67890 - 12345);
				expect((client as any)._ping).toBe(67890 - 12345);
			} finally {
				global.Date = originalDate;
			}
		});
	});

	describe('_checkSession', () => {
		it('should check session and schedule refresh', async () => {
			const checkResult: any = {refresh_in: 300000};
			mockConnectionManager.checkSession.mockResolvedValue(checkResult);

			await (client as any)._checkSession();

			expect(mockConnectionManager.checkSession).toHaveBeenCalled();
			expect(client.next).toHaveBeenCalledWith(checkResult);
			expect((global as any).clearTimeout).toHaveBeenCalled();
			expect((global as any).setTimeout).toHaveBeenCalledWith(expect.any(Function), 285000);
		});

		it('should handle no refresh_in with default value', async () => {
			mockConnectionManager.checkSession.mockResolvedValue({} as any);

			await (client as any)._checkSession();

			expect((global as any).setTimeout).toHaveBeenCalledWith(expect.any(Function), 285000);
		});

		it('should run the scheduled refresh callback', async () => {
			mockConnectionManager.checkSession.mockResolvedValue({refresh_in: 300000} as any);

			await (client as any)._checkSession();

			const setTimeoutMock: jest.Mock = (global as any).setTimeout as jest.Mock;
			const scheduledRefresh: () => void = setTimeoutMock.mock.calls[0][0] as () => void;
			const checkSessionSpy: jest.SpyInstance = jest.spyOn(client as any, '_checkSession').mockImplementation();
			try {
				scheduledRefresh();
				expect(checkSessionSpy).toHaveBeenCalledTimes(1);
			} finally {
				checkSessionSpy.mockRestore();
			}
		});

		it('should handle null checkSession result without calling next', async () => {
			mockConnectionManager.checkSession.mockResolvedValue(null);

			await (client as any)._checkSession();

			expect(mockConnectionManager.checkSession).toHaveBeenCalled();
			expect(client.next).not.toHaveBeenCalled();
			expect((global as any).setTimeout).toHaveBeenCalledWith(expect.any(Function), 285000);
		});
	});

	describe('removeSubscription', () => {
		it('should remove subscription and store', () => {
			const target: string = 'test-target';
			const mockSendDebugTargets: jest.SpyInstance = jest.spyOn(client as any, 'sendDebugTargets').mockImplementation();

			(client as any)._subscriptions.set(target, mockSubscription);
			(client as any)._stores.set(target, mockStore);

			(client as any).removeSubscription(target);

			expect(mockSubscription.unsubscribe).toHaveBeenCalled();
			expect(mockStore.destroy).toHaveBeenCalled();
			expect((client as any)._subscriptions.has(target)).toBe(false);
			expect((client as any)._stores.has(target)).toBe(false);
			expect(mockSendDebugTargets).toHaveBeenCalledWith('removeSubscription', target);
		});

		it('should handle missing subscription gracefully', () => {
			const mockSendDebugTargets: jest.SpyInstance = jest.spyOn(client as any, 'sendDebugTargets').mockImplementation();

			(client as any).removeSubscription('missing-target');

			expect(mockSendDebugTargets).toHaveBeenCalledWith('removeSubscription', 'missing-target');
		});
	});

	describe('reloadData', () => {
		it('should restart subscription for target store', () => {
			(client as any)._stores.set('test-target', mockStore);

			(client as any).reloadData('test-target');

			expect(mockStore.restartSubscription).toHaveBeenCalled();
		});
	});

	describe('updateSubscription', () => {
		it('should update existing store config', () => {
			const target: string = 'test-target';
			const config: any = {query: {status: 'active'}};

			(client as any)._stores.set(target, mockStore);

			(client as any).updateSubscription({target, scope: 'many', observe: 'testCollection', config});

			expect(mockStore.config).toBe(config);
			expect(mockStoreFactory).not.toHaveBeenCalled();
		});

		it("should create a new subscription when store doesn't exist", () => {
			const target: string = 'new-target';
			const config: any = {query: {status: 'active'}};

			(DataMiddlewareMap.getMiddleware as jest.Mock).mockReturnValue(null);

			(client as any).updateSubscription({target, scope: 'many', observe: 'testCollection', config});

			expect(mockStoreFactory).toHaveBeenCalledWith('many', 'testCollection', target);
			expect((client as any)._stores.get(target)).toBe(mockStore);
			expect((client as any)._subscriptions.get(target)).toBe(mockSubscription);
			expect(mockStore.config).toBe(config);
		});

		it('should handle store subscription with middleware', async () => {
			const target: string = 'middleware-target';
			const config: any = {query: {status: 'active'}};

			const mockMiddleware: jest.Mock = jest.fn().mockResolvedValue({processed: true});
			(DataMiddlewareMap.getMiddleware as jest.Mock).mockReturnValue(mockMiddleware);

			(client as any).updateSubscription({target, scope: 'many', observe: 'testCollection', config});

			const subscribeCall: any = mockStore.subscribe.mock.calls[0][0];
			const testMessage: any = {data: 'test'};

			await subscribeCall.next(testMessage);

			expect(DataMiddlewareMap.getMiddleware).toHaveBeenCalledWith('testCollection');
			expect(mockMiddleware).toHaveBeenCalledWith(testMessage, mockConnectionManager.user);
			expect(client.next).toHaveBeenCalledWith({processed: true});
		});

		it('should handle store subscription without middleware', async () => {
			const target: string = 'no-middleware-target';
			const config: any = {query: {status: 'active'}};

			(DataMiddlewareMap.getMiddleware as jest.Mock).mockReturnValue(null);

			(client as any).updateSubscription({target, scope: 'many', observe: 'testCollection', config});

			const subscribeCall: any = mockStore.subscribe.mock.calls[0][0];
			const testMessage: any = {data: 'test'};

			await subscribeCall.next(testMessage);

			expect(client.next).toHaveBeenCalledWith(testMessage);
		});

		it('should ignore messages for invalid targets', async () => {
			const target: string = 'invalid-target';
			const config: any = {query: {status: 'active'}};

			jest.spyOn(client as any, 'isValidTarget').mockReturnValue(false);

			(client as any).updateSubscription({target, scope: 'many', observe: 'testCollection', config});

			const subscribeCall: any = mockStore.subscribe.mock.calls[0][0];
			const testMessage: any = {data: 'test'};

			await subscribeCall.next(testMessage);

			expect(client.next).not.toHaveBeenCalledWith(testMessage);
		});

		it('should handle subscription error', () => {
			const config: any = {query: {status: 'active'}};

			(client as any).updateSubscription({target: 'error-target', scope: 'many', observe: 'testCollection', config});

			const subscribeCall: any = mockStore.subscribe.mock.calls[0][0];
			const testError: Error = new Error('Test error');

			subscribeCall.error(testError);

			expect(client.error).toHaveBeenCalledWith(testError);
		});

		it('should handle subscription complete', () => {
			const config: any = {query: {status: 'active'}};

			(client as any).updateSubscription({target: 'complete-target', scope: 'many', observe: 'testCollection', config});

			const subscribeCall: any = mockStore.subscribe.mock.calls[0][0];

			subscribeCall.complete();

			expect(client.complete).toHaveBeenCalled();
		});
	});

	describe('isValidTarget', () => {
		it('should return true for valid target', () => {
			(client as any)._stores.set('valid-target', mockStore);

			expect((client as any).isValidTarget('valid-target')).toBe(true);
		});

		it('should return false for invalid target', () => {
			expect((client as any).isValidTarget('invalid-target')).toBe(false);
		});

		it('should return false when stores is null', () => {
			(client as any)._stores = null;

			expect((client as any).isValidTarget('any-target')).toBe(false);
		});
	});

	describe('sendDebugTargets', () => {
		it('should send debug message with available targets', () => {
			const originalDate: DateConstructor = Date;
			const mockDate: jest.Mock = jest.fn(() => ({getTime: () => 98765}));
			global.Date = mockDate as any;
			try {
				(client as any)._stores.set('target1', mockStore);
				(client as any)._stores.set('target2', mockStore);

				(client as any).sendDebugTargets('test-event', 'test-target');

				expect(client.next).toHaveBeenCalledWith({
					type: 'debug',
					id: 98765,
					payload: {
						event: 'test-event',
						target: 'test-target',
						availableTargets: 'target1, target2'
					}
				});
			} finally {
				global.Date = originalDate;
			}
		});

		it('should return false when stores is null', () => {
			(client as any)._stores = null;

			expect((client as any).sendDebugTargets('event', 'target')).toBe(false);
		});
	});

	describe('clearSubscriptions', () => {
		it('should clear all subscriptions and stores', () => {
			const mockSendDebugTargets: jest.SpyInstance = jest.spyOn(client as any, 'sendDebugTargets').mockImplementation();

			(client as any)._subscriptions.set('sub1', mockSubscription);
			(client as any)._subscriptions.set('sub2', {unsubscribe: jest.fn()});
			(client as any)._stores.set('store1', mockStore);
			(client as any)._stores.set('store2', {destroy: jest.fn()});

			(client as any).clearSubscriptions();

			expect(mockSubscription.unsubscribe).toHaveBeenCalled();
			expect(mockStore.destroy).toHaveBeenCalled();
			expect((client as any)._subscriptions).toBeNull();
			expect((client as any)._stores).toBeNull();
			expect(mockSendDebugTargets).toHaveBeenCalledWith('clearSubscriptions', '*');
		});

		it('should handle null subscriptions and stores gracefully', () => {
			(client as any)._subscriptions = null;
			(client as any)._stores = null;

			const mockSendDebugTargets: jest.SpyInstance = jest.spyOn(client as any, 'sendDebugTargets').mockImplementation();

			expect(() => (client as any).clearSubscriptions()).not.toThrow();
			expect(mockSendDebugTargets).toHaveBeenCalledWith('clearSubscriptions', '*');
		});

		it('should skip unsubscribe and destroy when map entries are nullish', () => {
			const mockSendDebugTargets: jest.SpyInstance = jest.spyOn(client as any, 'sendDebugTargets').mockImplementation();
			try {
				const sub1: any = {unsubscribe: jest.fn()};
				(client as any)._subscriptions.set('a', sub1);
				(client as any)._subscriptions.set('b', null);
				(client as any)._stores.set('c', mockStore);
				(client as any)._stores.set('d', null);

				(client as any).clearSubscriptions();

				expect(sub1.unsubscribe).toHaveBeenCalled();
				expect(mockStore.destroy).toHaveBeenCalled();
				expect(mockSendDebugTargets).toHaveBeenCalledWith('clearSubscriptions', '*');
			} finally {
				mockSendDebugTargets.mockRestore();
			}
		});
	});

	describe('location setter', () => {
		it('should update location and notify connection manager', () => {
			(client as any).location = '/new/location';

			expect((client as any)._location).toBe('/new/location');
			expect(mockConnectionManager.location).toHaveBeenCalledWith('/new/location');
		});

		it('should not update if location is the same', () => {
			(client as any)._location = '/same/location';

			(client as any).location = '/same/location';

			expect(mockConnectionManager.location).not.toHaveBeenCalled();
		});
	});
});
