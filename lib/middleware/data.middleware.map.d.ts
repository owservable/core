export type DataMiddlewareProcessor = (doc: unknown, user: unknown) => unknown | Promise<unknown>;
export default class DataMiddlewareMap {
    static addMiddleware(collection: string, processor: DataMiddlewareProcessor): void;
    static hasMiddleware(collection: string): boolean;
    static getMiddleware(collection: string): DataMiddlewareProcessor | undefined;
    static keys(): string[];
    private static readonly _middlewares;
}
