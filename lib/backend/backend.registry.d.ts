import IObservableBackend from './i.observable.backend';
export default class BackendRegistry {
    static register(observe: string, backend: IObservableBackend): void;
    static get(observe: string): IObservableBackend | null;
    static has(observe: string): boolean;
    static keys(): string[];
    static clear(): void;
    private static readonly _backends;
    private constructor();
}
