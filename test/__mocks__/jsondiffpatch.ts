'use strict';

import {isEqual} from 'lodash';

type PropertyFilter = (name: string, context: any) => boolean;

const strip = (value: any, filter?: PropertyFilter): any => {
	if (!value || typeof value !== 'object') return value;
	if (Array.isArray(value)) return value.map((entry: any) => strip(entry, filter));
	const out: any = {};
	for (const key of Object.keys(value)) {
		if (filter && !filter(key, value)) continue;
		out[key] = strip(value[key], filter);
	}
	return out;
};

const diffWith =
	(filter?: PropertyFilter) =>
	(left: any, right: any): any =>
		isEqual(strip(left, filter), strip(right, filter)) ? undefined : {changed: true};

export const create = (options?: any): any => ({
	diff: diffWith(options?.propertyFilter)
});

export const diff = diffWith();
