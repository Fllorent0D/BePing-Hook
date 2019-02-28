import {Service} from 'typedi';
import {FirebaseService} from '../common/firebase/firebase-service';
import {LoggingService} from '../common/logging';
import * as admin from 'firebase-admin';
import {MasterCommandHandler} from './master-command-handler';
import {Guard} from '../common/guard';
import {AddListenerCommand, TabtSubscriptionType} from './subscription-model';
import DataSnapshot = admin.database.DataSnapshot;

@Service()
export class MasterSubscriptionsListener {
    constructor(
        private firebaseService: FirebaseService,
        private loggingService: LoggingService,
        private masterCommandHandler: MasterCommandHandler) {

    }

    async startAsync() {
        this.onFirebaseChildAdded();
    }

    private addNewListener(newValue: DataSnapshot) {

        Guard.isNumber(Number(newValue.val()), 'id');
        if (newValue.val().type !== TabtSubscriptionType.CLUB && newValue.val().type !== TabtSubscriptionType.DIVISION) {
            return;
        }

        const newSubscription = {
            id: newValue.val().id,
            type: newValue.val().type
        };

        this.loggingService.info('Receive new subscription on Firebase', newSubscription);

        const command: AddListenerCommand = {
            name: 'ADD-LISTENER',
            payload: {
                subscription: newSubscription,
                message: `${newSubscription.type}-${newSubscription.id}`
            }
        };
        setTimeout(() => this.masterCommandHandler.execAddListenerCommandAsync(command), Math.random() * 1000 + 1);
    }

    private onFirebaseChildAdded() {
        this.firebaseService.getDatabase()
            .ref('/notifications/subscriptions')
            .on('child_added', this.addNewListener.bind(this));
    }
}
