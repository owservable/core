'use strict';

import {each, isPlainObject, isString} from 'lodash';

const LOGICAL_OPERATORS: string[] = ['$and', '$or', '$nor'];

const _rootOf = (path: string): string => path.split('.')[0];

const _collectFieldReferences = (value: any, fields: Set<string>): void => {
	if (isString(value)) {
		if (value.startsWith('$') && !value.startsWith('$$') && value.length > 1) fields.add(_rootOf(value.substring(1)));
		return;
	}
	if (Array.isArray(value)) {
		each(value, (entry: any): void => _collectFieldReferences(entry, fields));
		return;
	}
	if (isPlainObject(value)) {
		each(Object.values(value), (entry: any): void => _collectFieldReferences(entry, fields));
	}
};

const _collect = (query: any, fields: Set<string>): void => {
	if (Array.isArray(query)) {
		each(query, (entry: any): void => _collect(entry, fields));
		return;
	}
	if (!isPlainObject(query)) return;

	each(Object.keys(query), (key: string): void => {
		const value: any = query[key];
		if (LOGICAL_OPERATORS.includes(key)) return _collect(value, fields);
		if (key.startsWith('$')) return _collectFieldReferences(value, fields);
		fields.add(_rootOf(key));
	});
};

const collectQueryFields = (query: any): string[] => {
	const fields: Set<string> = new Set<string>();
	_collect(query, fields);
	return [...fields];
};
export default collectQueryFields;
