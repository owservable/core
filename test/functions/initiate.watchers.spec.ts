'use strict';

import initiateWatchers from '../../src/functions/initiate.watchers';
import executeWatcher from '../../src/functions/execute/execute.watcher';
import executeProcessesInFolder from '../../src/functions/execute/execute.processes.in.folder';

jest.mock('../../src/functions/execute/execute.watcher');
jest.mock('../../src/functions/execute/execute.processes.in.folder');

const mockExecuteWatcher = executeWatcher as jest.MockedFunction<typeof executeWatcher>;
const mockExecuteProcessesInFolder = executeProcessesInFolder as jest.MockedFunction<typeof executeProcessesInFolder>;

describe('initiate.watchers tests', () => {
	it('should be defined', () => {
		expect(initiateWatchers).toBeDefined();
		expect(typeof initiateWatchers).toBe('function');
	});

	it('should call executeProcessesInFolder with default folder name', () => {
		initiateWatchers('/test/root');

		expect(mockExecuteProcessesInFolder).toHaveBeenCalledTimes(1);
		expect(mockExecuteProcessesInFolder).toHaveBeenCalledWith('/test/root', 'watchers', mockExecuteWatcher);
	});

	it('should call executeProcessesInFolder with custom folder name', () => {
		initiateWatchers('/test/root', 'custom-watchers');

		expect(mockExecuteProcessesInFolder).toHaveBeenCalledTimes(1);
		expect(mockExecuteProcessesInFolder).toHaveBeenCalledWith('/test/root', 'custom-watchers', mockExecuteWatcher);
	});

	it('should pass the executeWatcher function through', () => {
		initiateWatchers('/test/root');

		expect(mockExecuteProcessesInFolder.mock.calls[0][2]).toBe(mockExecuteWatcher);
	});
});
