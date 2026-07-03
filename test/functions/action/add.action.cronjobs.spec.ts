'use strict';

import addActionCronjobs from '../../../src/functions/action/add.action.cronjobs';

jest.mock('@owservable/folders', () => ({
	listSubfoldersFilesByFolderName: jest.fn()
}));

jest.mock('../../../src/functions/execute/execute.cronjob', () => ({
	__esModule: true,
	default: jest.fn()
}));

const mockListSubfoldersFilesByFolderName = require('@owservable/folders').listSubfoldersFilesByFolderName;
const mockExecuteCronJob = require('../../../src/functions/execute/execute.cronjob').default;

describe('add.action.cronjobs tests', () => {
	let consoleLogSpy: jest.SpyInstance;

	beforeEach(() => {
		consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
	});

	afterEach(() => {
		consoleLogSpy.mockRestore();
	});

	it('should be a function', () => {
		expect(typeof addActionCronjobs).toBe('function');
	});

	it('should handle actions with asCronjob and asCronjobInit methods', () => {
		const mockActionPath: string = '/path/to/cronjob-action.js';
		const mockAction: any = {
			asCronjob: jest.fn(),
			schedule: jest.fn().mockReturnValue('0 0 * * *'),
			asCronjobInit: jest.fn()
		};
		const MockActionClass: jest.Mock = jest.fn().mockImplementation(() => mockAction);

		mockListSubfoldersFilesByFolderName.mockReturnValue([mockActionPath]);
		jest.doMock(mockActionPath, () => ({default: MockActionClass}), {virtual: true});

		addActionCronjobs('/test/root', 'actions');

		expect(mockListSubfoldersFilesByFolderName).toHaveBeenCalledWith('/test/root', 'actions');
		expect(consoleLogSpy).toHaveBeenCalledWith('[@owservable] -> Initializing cronjob action', mockActionPath);
		expect(MockActionClass).toHaveBeenCalled();
		expect(mockAction.schedule).toHaveBeenCalled();
		expect(mockExecuteCronJob).toHaveBeenCalledWith({
			schedule: '0 0 * * *',
			init: mockAction.asCronjobInit,
			job: mockAction.asCronjob
		});
	});

	it('should handle actions with asCronjob but no asCronjobInit', () => {
		const mockActionPath: string = '/path/to/cronjob-action2.js';
		const mockAction: any = {
			asCronjob: jest.fn(),
			schedule: jest.fn().mockReturnValue('0 0 * * *')
		};
		const MockActionClass: jest.Mock = jest.fn().mockImplementation(() => mockAction);

		mockListSubfoldersFilesByFolderName.mockReturnValue([mockActionPath]);
		jest.doMock(mockActionPath, () => ({default: MockActionClass}), {virtual: true});

		addActionCronjobs('/test/root', 'actions');

		expect(mockExecuteCronJob).toHaveBeenCalledWith({
			schedule: '0 0 * * *',
			job: mockAction.asCronjob
		});
	});

	it('should skip actions without asCronjob method', () => {
		const mockActionPath: string = '/path/to/invalid-cronjob-action.js';
		const mockAction: any = {
			schedule: jest.fn().mockReturnValue('0 0 * * *')
		};
		const MockActionClass: jest.Mock = jest.fn().mockImplementation(() => mockAction);

		mockListSubfoldersFilesByFolderName.mockReturnValue([mockActionPath]);
		jest.doMock(mockActionPath, () => ({default: MockActionClass}), {virtual: true});

		addActionCronjobs('/test/root', 'actions');

		expect(mockExecuteCronJob).not.toHaveBeenCalled();
	});

	it('should handle actions with asCronjobInit as non-function', () => {
		const mockActionPath: string = '/path/to/cronjob-action3.js';
		const mockAction: any = {
			asCronjob: jest.fn(),
			schedule: jest.fn().mockReturnValue('0 0 * * *'),
			asCronjobInit: 'not-a-function'
		};
		const MockActionClass: jest.Mock = jest.fn().mockImplementation(() => mockAction);

		mockListSubfoldersFilesByFolderName.mockReturnValue([mockActionPath]);
		jest.doMock(mockActionPath, () => ({default: MockActionClass}), {virtual: true});

		addActionCronjobs('/test/root', 'actions');

		expect(mockExecuteCronJob).toHaveBeenCalledWith({
			schedule: '0 0 * * *',
			init: 'not-a-function',
			job: mockAction.asCronjob
		});
	});

	it('should handle empty action paths', () => {
		mockListSubfoldersFilesByFolderName.mockReturnValue([]);

		addActionCronjobs('/test/root', 'actions');

		expect(mockExecuteCronJob).not.toHaveBeenCalled();
		expect(consoleLogSpy).not.toHaveBeenCalled();
	});
});
