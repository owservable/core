'use strict';

import AStore from './a.store';
import EStoreType from '../enums/store.type.enum';
import IObservableBackend from '../backend/i.observable.backend';
import getHrtimeAsNumber from '../functions/performance/get.hrtime.as.number';

export default class CountStore extends AStore {
	constructor(backend: IObservableBackend, target: string) {
		super(backend, target);
		this._type = EStoreType.COUNT;
		Object.setPrototypeOf(this, CountStore.prototype);
	}

	protected shouldReload(change: any): boolean {
		if (this.isInitialSubscription(change)) return true;

		const {operationType: type} = change;
		switch (type) {
			case 'delete':
			case 'insert':
				return true;

			case 'replace':
			case 'update':
			default:
				return false;
		}
	}

	protected async load(change: any): Promise<void> {
		const startTime: number = getHrtimeAsNumber();

		if (Object.keys(this._config).length === 0) return this.emitOne(startTime, this._subscriptionId);
		if (!this.shouldReload(change)) return;

		const count = await this._backend.count(this._query);
		this.emitOne(startTime, this._subscriptionId, count);
	}
}
