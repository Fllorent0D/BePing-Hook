import {TabtSubscription} from '../master/subscription-model';

export interface AddListenerCmdEventPayload {
  subscription: TabtSubscription;
  message: string;
}

export interface ExecCmdSuccessEventPayload {
  ack: string;
}

export interface ExecCmdFailureEventPayload {
  error: Error;
}
