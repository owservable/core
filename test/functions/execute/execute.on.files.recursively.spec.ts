'use strict';

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import executeOnFilesRecursively from '../../../src/functions/execute/execute.on.files.recursively';

describe('execute.on.files.recursively tests', () => {
	let mockExecute: jest.Mock;
	let testDir: string;

	beforeEach(() => {
		mockExecute = jest.fn();
		testDir = path.join(os.tmpdir(), 'core-execute-recursively-' + Date.now() + '-' + Math.round(Math.random() * 100000));
	});

	afterEach(() => {
		if (fs.existsSync(testDir)) {
			fs.rmSync(testDir, {recursive: true, force: true});
		}
	});

	it('should exist and be a function', () => {
		expect(executeOnFilesRecursively).toBeDefined();
		expect(typeof executeOnFilesRecursively).toBe('function');
	});

	it('should execute on files in a folder', () => {
		fs.mkdirSync(testDir, {recursive: true});

		fs.writeFileSync(path.join(testDir, 'test1.js'), 'module.exports = { default: "test1" };');
		fs.writeFileSync(path.join(testDir, 'test2.js'), 'module.exports = { default: "test2" };');

		executeOnFilesRecursively(testDir, mockExecute);

		expect(mockExecute).toHaveBeenCalledTimes(2);
		expect(mockExecute).toHaveBeenCalledWith('test1');
		expect(mockExecute).toHaveBeenCalledWith('test2');
	});

	it('should handle empty folders', () => {
		fs.mkdirSync(testDir, {recursive: true});

		executeOnFilesRecursively(testDir, mockExecute);

		expect(mockExecute).not.toHaveBeenCalled();
	});

	it('should recurse into subdirectories', () => {
		const subDir: string = path.join(testDir, 'subdir');
		fs.mkdirSync(subDir, {recursive: true});
		fs.writeFileSync(path.join(subDir, 'subtest.js'), 'module.exports = { default: "subtest" };');

		executeOnFilesRecursively(testDir, mockExecute);

		expect(mockExecute).toHaveBeenCalledTimes(1);
		expect(mockExecute).toHaveBeenCalledWith('subtest');
	});

	it('should handle files without default export gracefully', () => {
		fs.mkdirSync(testDir, {recursive: true});
		fs.writeFileSync(path.join(testDir, 'nodefault.js'), 'module.exports = { someOtherExport: "value" };');

		executeOnFilesRecursively(testDir, mockExecute);

		expect(mockExecute).toHaveBeenCalledWith(undefined);
	});
});
