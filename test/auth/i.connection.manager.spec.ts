'use strict';

import type IConnectionManager from '../../src/auth/i.connection.manager';
import type ConnectionManagerRefreshType from '../../src/types/connection.manager.refresh.type';

describe('i.connection.manager tests', () => {
	it('allows implementing the connection manager contract', async () => {
		const refresh: ConnectionManagerRefreshType = {
			type: 'refresh',
			payload: {jwt: 'token', user: {id: 'u1'}},
			refresh_in: 300000
		};

		const manager: IConnectionManager = {
			user: (): any => ({id: 'u1'}),
			connected: jest.fn(),
			ping: jest.fn(),
			location: jest.fn(),
			disconnected: jest.fn(),
			checkSession: async (): Promise<ConnectionManagerRefreshType> => refresh
		};

		expect(manager.user()).toEqual({id: 'u1'});
		manager.connected('jwt-token');
		manager.ping(12);
		manager.location('/path');
		manager.disconnected();
		expect(manager.connected).toHaveBeenCalledWith('jwt-token');
		expect(manager.ping).toHaveBeenCalledWith(12);
		expect(manager.location).toHaveBeenCalledWith('/path');
		expect(manager.disconnected).toHaveBeenCalled();
		await expect(manager.checkSession()).resolves.toBe(refresh);
	});
});
