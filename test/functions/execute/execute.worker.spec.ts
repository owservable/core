'use strict';

import executeWorker from '../../../src/functions/execute/execute.worker';
import WorkerType from '../../../src/types/worker.type';

describe('execute.worker tests', () => {
	it('should be defined', () => {
		expect(executeWorker).toBeDefined();
		expect(typeof executeWorker).toBe('function');
	});

	it('should execute work immediately when init is not a function', () => {
		const mockWork: jest.Mock = jest.fn();
		const worker: WorkerType = {
			init: 'not a function' as any,
			work: mockWork
		};

		executeWorker(worker);

		expect(mockWork).toHaveBeenCalledTimes(1);
	});

	it('should execute work immediately when init is undefined', () => {
		const mockWork: jest.Mock = jest.fn();
		const worker: WorkerType = {
			work: mockWork
		};

		executeWorker(worker);

		expect(mockWork).toHaveBeenCalledTimes(1);
	});

	it('should execute work after init resolves when init is a function', async () => {
		const mockWork: jest.Mock = jest.fn();
		const mockInit: jest.Mock = jest.fn().mockResolvedValue(undefined);
		const worker: WorkerType = {
			init: mockInit,
			work: mockWork
		};

		executeWorker(worker);

		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(mockInit).toHaveBeenCalledTimes(1);
		expect(mockWork).toHaveBeenCalledTimes(1);
	});

	it('should handle missing work function with init', async () => {
		const mockInit: jest.Mock = jest.fn().mockResolvedValue(undefined);
		const worker: WorkerType = {
			init: mockInit,
			work: undefined as any
		};

		expect(() => executeWorker(worker)).not.toThrow();

		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(mockInit).toHaveBeenCalledTimes(1);
	});

	it('should preserve execution order of init then work', async () => {
		const executionOrder: string[] = [];
		const mockInit: jest.Mock = jest.fn().mockImplementation(() => {
			executionOrder.push('init');
			return Promise.resolve();
		});
		const mockWork: jest.Mock = jest.fn().mockImplementation(() => {
			executionOrder.push('work');
		});

		executeWorker({init: mockInit, work: mockWork});

		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(executionOrder).toEqual(['init', 'work']);
	});

	it('should handle undefined work with non-function init', () => {
		const worker: WorkerType = {
			init: 'not a function' as any,
			work: undefined as any
		};

		expect(() => executeWorker(worker)).not.toThrow();
	});
});
