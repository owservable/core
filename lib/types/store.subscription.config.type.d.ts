type StoreSubscriptionConfigType = {
    subscriptionId?: string;
    query: any;
    sort?: any;
    fields?: any;
    skip?: number;
    page?: number;
    pageSize?: number;
    strict: false;
    incremental: false;
    populates?: any;
    virtuals?: any;
    delay?: number;
};
export default StoreSubscriptionConfigType;
