'use strict';

import {listSubfoldersByName} from '@owservable/folders';

import executeProcessesInFolder from '../../../src/functions/execute/execute.processes.in.folder';
import executeOnFilesRecursively from '../../../src/functions/execute/execute.on.files.recursively';

jest.mock('@owservable/folders');
jest.mock('../../../src/functions/execute/execute.on.files.recursively');

describe('execute.processes.in.folder tests', () => {
	let mockListSubfoldersByName: jest.MockedFunction<(...args: any[]) => any>;
	let mockExecuteOnFilesRecursively: jest.MockedFunction<typeof executeOnFilesRecursively>;
	let mockExecute: jest.Mock;

	beforeEach(() => {
		mockListSubfoldersByName = listSubfoldersByName as jest.MockedFunction<(...args: any[]) => any>;
		mockExecuteOnFilesRecursively = executeOnFilesRecursively as jest.MockedFunction<typeof executeOnFilesRecursively>;
		mockExecute = jest.fn();
	});

	it('should execute processes in a single folder', () => {
		mockListSubfoldersByName.mockReturnValue(['/test/root/app1/workers']);

		executeProcessesInFolder('/test/root', 'workers', mockExecute);

		expect(mockListSubfoldersByName).toHaveBeenCalledWith('/test/root', 'workers');
		expect(mockExecuteOnFilesRecursively).toHaveBeenCalledTimes(1);
		expect(mockExecuteOnFilesRecursively).toHaveBeenCalledWith('/test/root/app1/workers', mockExecute);
	});

	it('should execute processes in multiple folders', () => {
		const mockFolders: string[] = ['/test/root/app1/workers', '/test/root/app2/workers', '/test/root/app3/workers'];
		mockListSubfoldersByName.mockReturnValue(mockFolders);

		executeProcessesInFolder('/test/root', 'workers', mockExecute);

		expect(mockExecuteOnFilesRecursively).toHaveBeenCalledTimes(3);
		mockFolders.forEach((folder, index) => {
			expect(mockExecuteOnFilesRecursively).toHaveBeenNthCalledWith(index + 1, folder, mockExecute);
		});
	});

	it('should handle empty folders array', () => {
		mockListSubfoldersByName.mockReturnValue([]);

		executeProcessesInFolder('/test/root', 'nonexistent', mockExecute);

		expect(mockListSubfoldersByName).toHaveBeenCalledWith('/test/root', 'nonexistent');
		expect(mockExecuteOnFilesRecursively).not.toHaveBeenCalled();
	});

	it('should pass the same execute function reference through', () => {
		const customExecute: jest.Mock = jest.fn();
		mockListSubfoldersByName.mockReturnValue(['/test/root/app/cronjobs']);

		executeProcessesInFolder('/test/root', 'cronjobs', customExecute);

		expect(mockExecuteOnFilesRecursively).toHaveBeenCalledWith('/test/root/app/cronjobs', customExecute);
	});
});
