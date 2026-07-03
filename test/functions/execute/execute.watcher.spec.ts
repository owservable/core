'use strict';

import executeWatcher from '../../../src/functions/execute/execute.watcher';
import WatcherType from '../../../src/types/watcher.type';

describe('execute.watcher tests', () => {
	let mockInit: jest.Mock;
	let mockWatch: jest.Mock;

	beforeEach(() => {
		mockInit = jest.fn().mockResolvedValue(undefined);
		mockWatch = jest.fn();
	});

	describe('when waitForInit is false or undefined', () => {
		it('should execute init and watch immediately when waitForInit is false', () => {
			executeWatcher({init: mockInit, watch: mockWatch, waitForInit: false});

			expect(mockInit).toHaveBeenCalled();
			expect(mockWatch).toHaveBeenCalled();
		});

		it('should execute init and watch immediately when waitForInit is undefined', () => {
			executeWatcher({init: mockInit, watch: mockWatch});

			expect(mockInit).toHaveBeenCalled();
			expect(mockWatch).toHaveBeenCalled();
		});

		it('should skip init when init is not a function', () => {
			executeWatcher({init: 'not-a-function' as any, watch: mockWatch, waitForInit: false});

			expect(mockInit).not.toHaveBeenCalled();
			expect(mockWatch).toHaveBeenCalled();
		});

		it('should skip init when init is undefined', () => {
			executeWatcher({watch: mockWatch, waitForInit: false});

			expect(mockInit).not.toHaveBeenCalled();
			expect(mockWatch).toHaveBeenCalled();
		});

		it('should not throw when watch is undefined', () => {
			expect(() => executeWatcher({init: mockInit, watch: undefined as any, waitForInit: false})).not.toThrow();
			expect(mockInit).toHaveBeenCalled();
		});

		it('should run the chained then callback after init resolves', async () => {
			const marker: jest.Mock = jest.fn();
			mockInit.mockImplementation(() => Promise.resolve().then(() => marker()));

			executeWatcher({init: mockInit, watch: mockWatch, waitForInit: false});

			await new Promise((resolve) => setTimeout(resolve, 5));
			expect(marker).toHaveBeenCalledTimes(1);
			expect(mockWatch).toHaveBeenCalled();
		});
	});

	describe('when waitForInit is true', () => {
		it('should wait for init to complete before calling watch', () => {
			const mockThen: jest.Mock = jest.fn().mockImplementation((callback) => {
				callback();
				return Promise.resolve();
			});
			mockInit.mockReturnValue({then: mockThen});

			executeWatcher({init: mockInit, watch: mockWatch, waitForInit: true});

			expect(mockInit).toHaveBeenCalled();
			expect(mockThen).toHaveBeenCalledWith(expect.any(Function));
			expect(mockWatch).toHaveBeenCalled();
		});

		it('should call watch directly when init is not a function', () => {
			executeWatcher({init: 'not-a-function' as any, watch: mockWatch, waitForInit: true});

			expect(mockInit).not.toHaveBeenCalled();
			expect(mockWatch).toHaveBeenCalled();
		});

		it('should call watch directly when init is undefined', () => {
			executeWatcher({watch: mockWatch, waitForInit: true});

			expect(mockInit).not.toHaveBeenCalled();
			expect(mockWatch).toHaveBeenCalled();
		});

		it('should resolve watch after init promise fulfills', async () => {
			const order: string[] = [];
			mockInit.mockImplementation(async () => {
				order.push('init');
			});
			const watchFn: jest.Mock = jest.fn(() => order.push('watch'));

			executeWatcher({init: mockInit, watch: watchFn, waitForInit: true});

			await new Promise((resolve) => setTimeout(resolve, 5));
			expect(order).toEqual(['init', 'watch']);
		});

		it('should not throw when watch is undefined after init resolves', async () => {
			executeWatcher({init: mockInit, watch: undefined as any, waitForInit: true});

			await new Promise((resolve) => setTimeout(resolve, 5));
			expect(mockInit).toHaveBeenCalled();
		});

		it('should not throw when init is null and watch is undefined', () => {
			expect(() => executeWatcher({init: null as any, watch: undefined as any, waitForInit: true})).not.toThrow();
		});
	});

	describe('edge cases', () => {
		it('should handle a fully empty watcher object', () => {
			expect(() => executeWatcher({} as WatcherType)).not.toThrow();
		});

		it('should treat truthy non-boolean waitForInit values as immediate execution', () => {
			executeWatcher({init: mockInit, watch: mockWatch, waitForInit: 1 as any});

			expect(mockInit).toHaveBeenCalled();
			expect(mockWatch).toHaveBeenCalled();
		});
	});
});
