import AStore from '../a.store';
import type StoreScopeType from '../../types/store.scope.type';
declare const storeFactory: (scope: StoreScopeType, observe: string, target: string) => AStore;
export default storeFactory;
