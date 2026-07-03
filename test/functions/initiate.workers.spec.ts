'use strict';

import initiateWorkers from '../../src/functions/initiate.workers';
import executeWorker from '../../src/functions/execute/execute.worker';
import executeProcessesInFolder from '../../src/functions/execute/execute.processes.in.folder';

jest.mock('../../src/functions/execute/execute.worker');
jest.mock('../../src/functions/execute/execute.processes.in.folder');

const mockExecuteWorker = executeWorker as jest.MockedFunction<typeof executeWorker>;
const mockExecuteProcessesInFolder = executeProcessesInFolder as jest.MockedFunction<typeof executeProcessesInFolder>;

describe('initiate.workers tests', () => {
	it('should be defined', () => {
		expect(initiateWorkers).toBeDefined();
		expect(typeof initiateWorkers).toBe('function');
	});

	it('should call executeProcessesInFolder with default folder name', () => {
		initiateWorkers('/test/root');

		expect(mockExecuteProcessesInFolder).toHaveBeenCalledTimes(1);
		expect(mockExecuteProcessesInFolder).toHaveBeenCalledWith('/test/root', 'workers', mockExecuteWorker);
	});

	it('should call executeProcessesInFolder with custom folder name', () => {
		initiateWorkers('/test/root', 'custom-workers');

		expect(mockExecuteProcessesInFolder).toHaveBeenCalledTimes(1);
		expect(mockExecuteProcessesInFolder).toHaveBeenCalledWith('/test/root', 'custom-workers', mockExecuteWorker);
	});

	it('should pass the executeWorker function through', () => {
		initiateWorkers('/test/root');

		expect(mockExecuteProcessesInFolder.mock.calls[0][2]).toBe(mockExecuteWorker);
	});
});
