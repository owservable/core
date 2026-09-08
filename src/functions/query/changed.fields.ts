'use strict';

import {each, isEmpty} from 'lodash';

const _rootOf = (path: string): string => path.split('.')[0];

const changedFields = (change: any): string[] => {
	const description: any = change?.updateDescription;
	if (isEmpty(description)) return [];

	const fields: Set<string> = new Set<string>();
	each(description.removedFields ?? [], (field: string): void => {
		fields.add(_rootOf(field));
	});
	each(Object.keys(description.updatedFields ?? {}), (field: string): void => {
		fields.add(_rootOf(field));
	});
	return [...fields];
};
export default changedFields;
