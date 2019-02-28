import {Service} from 'typedi';
import {Cluster} from 'cluster';
import {LoggingService} from '../common/logging';
import {ClusterIpcBusEventReceiverOptions, ClusterIpcBusReceiver} from '../common/cluster';
import {AddListenerCmdEventPayload, EventTypes, ExecCmdSuccessEventPayload} from '../events';
import {WorkerNotification} from './worker-notification';

const cluster: Cluster = require('cluster');

@Service()
export class WorkerCommandHandler {

    constructor(
        private _loggingService: LoggingService,
        private _clusterIpcBusReceiver: ClusterIpcBusReceiver,
        private _workerNotification: WorkerNotification
    ) {
        this._loggingService.trace(`${WorkerCommandHandler.name} has been build`);
    }

    async startAsync(): Promise<void> {
        await this.initializeAsync();
        return this._clusterIpcBusReceiver.startAsync();
    }

    private initializeAsync(): Promise<void> {
        const options: ClusterIpcBusEventReceiverOptions = {
            items: [
                {
                    actionEventName: EventTypes.EXEC_ADD_LISTENER,
                    successEvtName: EventTypes.EXEC_CMD_SUCCESS,
                    failureEvtName: EventTypes.EXEC_CMD_FAILURE,
                    onAction: this.onAddListener.bind(this)
                },
                {
                    actionEventName: EventTypes.EXEC_CLEAN_LISTENERS,
                    successEvtName: EventTypes.EXEC_CMD_SUCCESS,
                    failureEvtName: EventTypes.EXEC_CMD_FAILURE,
                    onAction: this.onCleanListeners.bind(this)
                }
            ]
        };
        return this._clusterIpcBusReceiver.initializeAsync(options);
    }

    private async onCleanListeners() {
        this._loggingService.debug(`${WorkerCommandHandler.name} executing command to clean subscriptions...`);
        this._workerNotification.reset();
        const response: ExecCmdSuccessEventPayload = {
            ack: `ACK from Worker INDEX:[${cluster.worker.id}] PID:[${cluster.worker.process.pid}] Successfully cleaned`
        };

        return response;
    }

    private async onAddListener(requestEventPayload: AddListenerCmdEventPayload): Promise<ExecCmdSuccessEventPayload> {

        const subscription = requestEventPayload.subscription;
        this._loggingService.debug(`${WorkerCommandHandler.name} executing command for [divisionId : ${subscription}]...`);

        await this._workerNotification.addSubscriptionAsync(subscription);

        // Create a new SUCCESS Event and send it to master through the IPC Event Bus
        const response: ExecCmdSuccessEventPayload = {
            ack: `ACK from Worker INDEX:[${cluster.worker.id}] PID:[${cluster.worker.process.pid}] DIVISION-ID:[${subscription}]`
        };

        return response;
    }
}
