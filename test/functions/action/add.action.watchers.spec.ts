'use strict';

import addActionWatchers from '../../../src/functions/action/add.action.watchers';

jest.mock('@owservable/folders', () => ({
	listSubfoldersFilesByFolderName: jest.fn()
}));

jest.mock('../../../src/functions/execute/execute.watcher', () => ({
	__esModule: true,
	default: jest.fn()
}));

const mockListSubfoldersFilesByFolderName = require('@owservable/folders').listSubfoldersFilesByFolderName;
const mockExecuteWatcher = require('../../../src/functions/execute/execute.watcher').default;

describe('add.action.watchers tests', () => {
	let consoleLogSpy: jest.SpyInstance;

	beforeEach(() => {
		consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
	});

	afterEach(() => {
		consoleLogSpy.mockRestore();
	});

	it('should be a function', () => {
		expect(typeof addActionWatchers).toBe('function');
	});

	it('should handle actions with asWatcher and asWatcherInit methods', () => {
		const mockActionPath: string = '/path/to/watcher-action.js';
		const mockAction: any = {
			asWatcher: jest.fn(),
			asWatcherInit: jest.fn()
		};
		const MockActionClass: jest.Mock = jest.fn().mockImplementation(() => mockAction);

		mockListSubfoldersFilesByFolderName.mockReturnValue([mockActionPath]);
		jest.doMock(mockActionPath, () => ({default: MockActionClass}), {virtual: true});

		addActionWatchers('/test/root', 'watchers');

		expect(mockListSubfoldersFilesByFolderName).toHaveBeenCalledWith('/test/root', 'watchers');
		expect(consoleLogSpy).toHaveBeenCalledWith('[@owservable] -> Initializing watcher action', mockActionPath);
		expect(MockActionClass).toHaveBeenCalled();
		expect(mockExecuteWatcher).toHaveBeenCalledWith({
			init: mockAction.asWatcherInit,
			watch: mockAction.asWatcher
		});
	});

	it('should handle actions with asWatcher but no asWatcherInit', () => {
		const mockActionPath: string = '/path/to/watcher-action2.js';
		const mockAction: any = {
			asWatcher: jest.fn()
		};
		const MockActionClass: jest.Mock = jest.fn().mockImplementation(() => mockAction);

		mockListSubfoldersFilesByFolderName.mockReturnValue([mockActionPath]);
		jest.doMock(mockActionPath, () => ({default: MockActionClass}), {virtual: true});

		addActionWatchers('/test/root', 'watchers');

		expect(mockExecuteWatcher).toHaveBeenCalledWith({
			watch: mockAction.asWatcher
		});
	});

	it('should skip actions without asWatcher method', () => {
		const mockActionPath: string = '/path/to/invalid-watcher-action.js';
		const mockAction: any = {};
		const MockActionClass: jest.Mock = jest.fn().mockImplementation(() => mockAction);

		mockListSubfoldersFilesByFolderName.mockReturnValue([mockActionPath]);
		jest.doMock(mockActionPath, () => ({default: MockActionClass}), {virtual: true});

		addActionWatchers('/test/root', 'watchers');

		expect(mockExecuteWatcher).not.toHaveBeenCalled();
	});

	it('should handle actions with asWatcherInit as non-function', () => {
		const mockActionPath: string = '/path/to/watcher-action3.js';
		const mockAction: any = {
			asWatcher: jest.fn(),
			asWatcherInit: 'not-a-function'
		};
		const MockActionClass: jest.Mock = jest.fn().mockImplementation(() => mockAction);

		mockListSubfoldersFilesByFolderName.mockReturnValue([mockActionPath]);
		jest.doMock(mockActionPath, () => ({default: MockActionClass}), {virtual: true});

		addActionWatchers('/test/root', 'watchers');

		expect(mockExecuteWatcher).toHaveBeenCalledWith({
			init: 'not-a-function',
			watch: mockAction.asWatcher
		});
	});

	it('should handle empty action paths', () => {
		mockListSubfoldersFilesByFolderName.mockReturnValue([]);

		addActionWatchers('/test/root', 'watchers');

		expect(mockExecuteWatcher).not.toHaveBeenCalled();
		expect(consoleLogSpy).not.toHaveBeenCalled();
	});
});
