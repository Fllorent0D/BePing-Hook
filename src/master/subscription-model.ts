export enum TabtSubscriptionType {
    CLUB = 'club',
    DIVISION = 'division'
}

export interface TabtSubscription {
    type: TabtSubscriptionType;
    id: string;
}

export interface MasterCommand {
    name: string;
    payload: {
        subscription: TabtSubscription;
        message: string;
    };
}

export interface AddListenerCommand {
    name: string;
    payload: {
        subscription: TabtSubscription;
        message: string;
    };
}
