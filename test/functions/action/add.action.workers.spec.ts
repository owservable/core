'use strict';

import addActionWorkers from '../../../src/functions/action/add.action.workers';

jest.mock('@owservable/folders', () => ({
	listSubfoldersFilesByFolderName: jest.fn()
}));

jest.mock('../../../src/functions/execute/execute.worker', () => ({
	__esModule: true,
	default: jest.fn()
}));

const mockListSubfoldersFilesByFolderName = require('@owservable/folders').listSubfoldersFilesByFolderName;
const mockExecuteWorker = require('../../../src/functions/execute/execute.worker').default;

describe('add.action.workers tests', () => {
	let consoleLogSpy: jest.SpyInstance;

	beforeEach(() => {
		consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
	});

	afterEach(() => {
		consoleLogSpy.mockRestore();
	});

	it('should be a function', () => {
		expect(typeof addActionWorkers).toBe('function');
	});

	it('should handle actions with asWorker and asWorkerInit methods', () => {
		const mockActionPath: string = '/path/to/worker-action.js';
		const mockAction: any = {
			asWorker: jest.fn(),
			asWorkerInit: jest.fn()
		};
		const MockActionClass: jest.Mock = jest.fn().mockImplementation(() => mockAction);

		mockListSubfoldersFilesByFolderName.mockReturnValue([mockActionPath]);
		jest.doMock(mockActionPath, () => ({default: MockActionClass}), {virtual: true});

		addActionWorkers('/test/root', 'workers');

		expect(mockListSubfoldersFilesByFolderName).toHaveBeenCalledWith('/test/root', 'workers');
		expect(consoleLogSpy).toHaveBeenCalledWith('[@owservable] -> Initializing worker action', mockActionPath);
		expect(MockActionClass).toHaveBeenCalled();
		expect(mockExecuteWorker).toHaveBeenCalledWith({
			init: mockAction.asWorkerInit,
			work: mockAction.asWorker
		});
	});

	it('should handle actions with asWorker but no asWorkerInit', () => {
		const mockActionPath: string = '/path/to/worker-action2.js';
		const mockAction: any = {
			asWorker: jest.fn()
		};
		const MockActionClass: jest.Mock = jest.fn().mockImplementation(() => mockAction);

		mockListSubfoldersFilesByFolderName.mockReturnValue([mockActionPath]);
		jest.doMock(mockActionPath, () => ({default: MockActionClass}), {virtual: true});

		addActionWorkers('/test/root', 'workers');

		expect(mockExecuteWorker).toHaveBeenCalledWith({
			work: mockAction.asWorker
		});
	});

	it('should skip actions without asWorker method', () => {
		const mockActionPath: string = '/path/to/invalid-worker-action.js';
		const mockAction: any = {};
		const MockActionClass: jest.Mock = jest.fn().mockImplementation(() => mockAction);

		mockListSubfoldersFilesByFolderName.mockReturnValue([mockActionPath]);
		jest.doMock(mockActionPath, () => ({default: MockActionClass}), {virtual: true});

		addActionWorkers('/test/root', 'workers');

		expect(mockExecuteWorker).not.toHaveBeenCalled();
	});

	it('should handle actions with asWorkerInit as non-function', () => {
		const mockActionPath: string = '/path/to/worker-action3.js';
		const mockAction: any = {
			asWorker: jest.fn(),
			asWorkerInit: 'not-a-function'
		};
		const MockActionClass: jest.Mock = jest.fn().mockImplementation(() => mockAction);

		mockListSubfoldersFilesByFolderName.mockReturnValue([mockActionPath]);
		jest.doMock(mockActionPath, () => ({default: MockActionClass}), {virtual: true});

		addActionWorkers('/test/root', 'workers');

		expect(mockExecuteWorker).toHaveBeenCalledWith({
			init: 'not-a-function',
			work: mockAction.asWorker
		});
	});

	it('should handle empty action paths', () => {
		mockListSubfoldersFilesByFolderName.mockReturnValue([]);

		addActionWorkers('/test/root', 'workers');

		expect(mockExecuteWorker).not.toHaveBeenCalled();
		expect(consoleLogSpy).not.toHaveBeenCalled();
	});
});
