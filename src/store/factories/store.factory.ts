'use strict';

import AStore from '../a.store';
import CountStore from '../count.store';
import DocumentStore from '../document.store';
import CollectionStore from '../collection.store';
import type StoreScopeType from '../../types/store.scope.type';
import BackendRegistry from '../../backend/backend.registry';
import IObservableBackend from '../../backend/i.observable.backend';

const storeFactory = (scope: StoreScopeType, observe: string, target: string): AStore => {
	const backend: IObservableBackend = BackendRegistry.get(observe);

	if (scope === 'many') return new CollectionStore(backend, target);
	if (scope === 'count') return new CountStore(backend, target);
	return new DocumentStore(backend, target);
};
export default storeFactory;
