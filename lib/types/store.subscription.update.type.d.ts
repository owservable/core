import StoreScopeType from './store.scope.type';
import StoreSubscriptionConfigType from './store.subscription.config.type';
type StoreSubscriptionUpdateType = {
    target: string;
    scope: StoreScopeType;
    config: StoreSubscriptionConfigType;
    observe: string;
};
export default StoreSubscriptionUpdateType;
