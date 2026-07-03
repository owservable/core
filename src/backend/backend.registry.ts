'use strict';

import IObservableBackend from './i.observable.backend';

export default class BackendRegistry {
	public static register(observe: string, backend: IObservableBackend): void {
		if (BackendRegistry._backends.has(observe)) {
			console.warn(`[@owservable/core] -> BackendRegistry: overwriting backend registration for "${observe}"`);
		}
		BackendRegistry._backends.set(observe, backend);
	}

	public static get(observe: string): IObservableBackend | null {
		return BackendRegistry._backends.get(observe) ?? null;
	}

	public static has(observe: string): boolean {
		return BackendRegistry._backends.has(observe);
	}

	public static keys(): string[] {
		return Array.from(BackendRegistry._backends.keys());
	}

	public static clear(): void {
		BackendRegistry._backends.clear();
	}

	private static readonly _backends: Map<string, IObservableBackend> = new Map<string, IObservableBackend>();

	private constructor() {}
}
