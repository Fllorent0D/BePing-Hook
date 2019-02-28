import {Service} from 'typedi';
import {LoggingService} from '../common/logging';
import {MasterCommandHandler} from './master-command-handler';
import {FirebaseService} from '../common/firebase/firebase-service';
import * as cron from 'node-cron';
import {FirebaseSnapshot} from '../common/helpers/firebase-snapshot';
import * as admin from 'firebase-admin';
import {AddListenerCommand, TabtSubscription} from './subscription-model';
import DataSnapshot = admin.database.DataSnapshot;

@Service()
export class MasterCronTasks {
    constructor(private loggingService: LoggingService,
                private masterCommandHandler: MasterCommandHandler,
                private firebaseService: FirebaseService) {

    }

    startAsync() {
        cron.schedule('30 * * * * *', this.resetWorkers.bind(this));
        this.loggingService.trace(`[${MasterCronTasks.name}] Cron task is set`);

    }

    async resetWorkers() {
        this.loggingService.info(`[${MasterCronTasks.name}] Reset workers it's midnight`);
        await this.masterCommandHandler.execCleanListenerAsync();

        this.loggingService.info(`[${MasterCronTasks.name}] Let set subscriptions for today`);
        this.firebaseService.getDatabase()
            .ref('/notifications/subscriptions')
            .once('value')
            .then((ds: DataSnapshot) => FirebaseSnapshot.SnapshotToArray<TabtSubscription>(ds))
            .then(async (subscriptions: TabtSubscription[]) => {
                for (const subscription of subscriptions) {
                    const command: AddListenerCommand = {
                        name: 'ADD-LISTENER',
                        payload: {
                            subscription: subscription,
                            message: `${subscription.type}-${subscription.id}`
                        }
                    };
                    await this.masterCommandHandler.execAddListenerCommandAsync(command);
                }
            })
            .catch((error: Error) => this.loggingService.error(`Error when retreiving subscriptions`));
    }

}
