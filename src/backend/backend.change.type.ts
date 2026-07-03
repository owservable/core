'use strict';

type BackendChangeType = {
	ns?: any;
	documentKey?: any;
	operationType?: 'insert' | 'update' | 'replace' | 'delete' | string;
	updateDescription?: {
		updatedFields?: any;
		removedFields?: string[];
	};
	fullDocument?: any;
};
export default BackendChangeType;
