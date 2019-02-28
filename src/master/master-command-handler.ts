import {Service} from 'typedi';
import {LoggingService} from '../common/logging';
import {ClusterIpcBusEmitter, ClusterIpcBusEmitterOptions} from '../common/cluster';
import {MasterWorkerCache, MasterWorkerMapEntry} from './master-worker-cache';
import {AddListenerCmdEventPayload, EventTypes, ExecCmdSuccessEventPayload} from '../events';
import {Util} from '../common/helpers';
import {AddListenerCommand, TabtSubscription} from './subscription-model';

@Service()
export class MasterCommandHandler {

    private _currentWorkerIndex: number;
    private static readonly TIMEOUT: number = 20000; // ms

    constructor(
        private _loggingService: LoggingService,
        private _masterWorkerCache: MasterWorkerCache,
        private _ipcBusEventEmitter: ClusterIpcBusEmitter) {
        this._currentWorkerIndex = 0;
        this._loggingService.debug(`${MasterCommandHandler.name} has been build`);
    }

    async execAddListenerCommandAsync(command: AddListenerCommand): Promise<void> {
        this._loggingService.trace(`${MasterCommandHandler.name} receives a addListerner command`, command);
        let mapEntry: MasterWorkerMapEntry = null;

        const subscription = command.payload.subscription;
        mapEntry = await this.getTargetWorkerAsync(subscription);

        // Through the IPC eventBus, asks the worker process the execute the command
        // Listen for SUCCESS ACK - FAILURE will throw exception
        const handlerOptions: ClusterIpcBusEmitterOptions = {
            actionEventName: EventTypes.EXEC_ADD_LISTENER,
            successEvtName: EventTypes.EXEC_CMD_SUCCESS,
            failureEvetName: EventTypes.EXEC_CMD_FAILURE,
            receiveTimeout: MasterCommandHandler.TIMEOUT
        };
        const requestPayload: AddListenerCmdEventPayload = {...command.payload};
        try {
            const successPayload: ExecCmdSuccessEventPayload =
                await this._ipcBusEventEmitter.sendEventAndWaitAnswerAsync<AddListenerCmdEventPayload, ExecCmdSuccessEventPayload>
                (requestPayload, mapEntry.wpid, mapEntry.worker, handlerOptions);

            mapEntry.subscriptions.push(subscription);
        } catch (err) {
            this._loggingService.error(`${MasterCommandHandler.name} not registering new subscription for ${mapEntry.wpid}`);
        }

    }

    async execCleanListenerAsync() {

        const cpusCount = Util.cpusCount;
        for (let i = 0; i < cpusCount; i++) {
            const workerMapEntry = await this._masterWorkerCache.getEntryByIndexAsync(i);

            if (workerMapEntry.subscriptions.length === 0) {
                continue;
            }

            this._loggingService.info(`Cleaning subscriptions of worker ${workerMapEntry.wpid}`);

            workerMapEntry.subscriptions = [];

            const handlerOptions: ClusterIpcBusEmitterOptions = {
                actionEventName: EventTypes.EXEC_CLEAN_LISTENERS,
                successEvtName: EventTypes.EXEC_CMD_SUCCESS,
                failureEvetName: EventTypes.EXEC_CMD_FAILURE,
                receiveTimeout: MasterCommandHandler.TIMEOUT
            };

            const successPayload: ExecCmdSuccessEventPayload =
                await this._ipcBusEventEmitter.sendEventAndWaitAnswerAsync<null, ExecCmdSuccessEventPayload>
                (null, workerMapEntry.wpid, workerMapEntry.worker, handlerOptions);

            this._loggingService.info('Successfully cleaned worker' + workerMapEntry.wpid);
        }

    }

    private async getTargetWorkerAsync(subscription: TabtSubscription): Promise<MasterWorkerMapEntry> {

        let workerMapEntry = await this._masterWorkerCache.getEntryBySybscriptionIdAsync(subscription);

        if (workerMapEntry) {
            this._loggingService.debug(`
      ${MasterCommandHandler.name} [Subscription: ${subscription.type}-${subscription.id}] is ALREADY handled by worker [PID:${workerMapEntry.wpid}]`);
        } else {
            workerMapEntry = await this._masterWorkerCache.getEntryByIndexAsync(this._currentWorkerIndex);
            this._loggingService.debug(this._currentWorkerIndex.toFixed());
            this._currentWorkerIndex = (this._currentWorkerIndex + 1) % Util.cpusCount;
            this._loggingService.debug(
                `${MasterCommandHandler.name} [Subscription: ${subscription.type}-${subscription.id}] is NOW handled by worker [PID:${workerMapEntry.wpid}]`);
        }
        // this._masterWorkerCache.displayCache();
        return workerMapEntry;
    }
}
