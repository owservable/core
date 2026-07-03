'use strict';

import initiateCronjobs from '../../src/functions/initiate.cronjobs';
import executeCronjob from '../../src/functions/execute/execute.cronjob';
import executeProcessesInFolder from '../../src/functions/execute/execute.processes.in.folder';

jest.mock('../../src/functions/execute/execute.cronjob');
jest.mock('../../src/functions/execute/execute.processes.in.folder');

const mockExecuteCronjob = executeCronjob as jest.MockedFunction<typeof executeCronjob>;
const mockExecuteProcessesInFolder = executeProcessesInFolder as jest.MockedFunction<typeof executeProcessesInFolder>;

describe('initiate.cronjobs tests', () => {
	it('should be defined', () => {
		expect(initiateCronjobs).toBeDefined();
		expect(typeof initiateCronjobs).toBe('function');
	});

	it('should call executeProcessesInFolder with default folder name', () => {
		initiateCronjobs('/test/root');

		expect(mockExecuteProcessesInFolder).toHaveBeenCalledTimes(1);
		expect(mockExecuteProcessesInFolder).toHaveBeenCalledWith('/test/root', 'cronjobs', mockExecuteCronjob);
	});

	it('should call executeProcessesInFolder with custom folder name', () => {
		initiateCronjobs('/test/root', 'custom-cronjobs');

		expect(mockExecuteProcessesInFolder).toHaveBeenCalledTimes(1);
		expect(mockExecuteProcessesInFolder).toHaveBeenCalledWith('/test/root', 'custom-cronjobs', mockExecuteCronjob);
	});

	it('should pass the executeCronjob function through', () => {
		initiateCronjobs('/test/root');

		expect(mockExecuteProcessesInFolder.mock.calls[0][2]).toBe(mockExecuteCronjob);
	});
});
