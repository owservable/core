![owservable](https://avatars0.githubusercontent.com/u/87773159?s=75)

# @owservable/core

The database-agnostic heart of the owservable reactive stack: the websocket subscription protocol, the reactive stores, and the `IObservableBackend` interface that database adapters implement.

Pair it with a backend adapter:

- [@owservable/mongodb](https://github.com/owservable/mongodb) — MongoDB change streams via mongoose
- [@owservable/postgres](https://github.com/owservable/postgres) — PostgreSQL LISTEN/NOTIFY via MikroORM

## 🚀 Features

- **OwservableClient**: per-socket subscription manager speaking the owservable wire protocol (`subscribe`/`unsubscribe`/`reload`, `update`/`increment`/`total`/`delete`)
- **Reactive Stores**: `CollectionStore`, `DocumentStore`, `CountStore` — RxJS subjects that reload and re-emit when their backend reports relevant changes
- **IObservableBackend**: the interface adapters implement (change feed + query execution); stores never touch a database driver
- **BackendRegistry**: maps `observe` targets to registered backends, across any number of databases
- **Actions runtime**: cronjobs, workers and watchers wiring via [@owservable/actions](https://github.com/owservable/actions)
- **Data middlewares**: per-channel payload post-processing via `DataMiddlewareMap`

## 📦 Installation

```bash
npm install @owservable/core
```

or

```bash
pnpm add @owservable/core
```

## 📄 License

Unlicense — see [LICENSE](LICENSE).
