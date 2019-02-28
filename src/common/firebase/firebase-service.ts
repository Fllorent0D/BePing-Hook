import * as firebase from 'firebase-admin';
import * as admin from 'firebase-admin';
import {Service} from 'typedi';
import {ConfigurationService} from '../../config';
import {LoggingService} from '../logging';
import {JsonHelper} from '../helpers';
import MessagingPayload = admin.messaging.MessagingPayload;
import MessagingOptions = admin.messaging.MessagingOptions;

@Service()
export class FirebaseService {
    private app: firebase.app.App;

    constructor(private configurationService: ConfigurationService,
                private loggingService: LoggingService) {
        this.app = firebase.initializeApp({
            credential: admin.credential.cert(this.configurationService.config.firebase),
            databaseURL: 'https://beping-196714.firebaseio.com'
        });
        this.loggingService.info('Initialize Firebase');
    }

    async sendNotifications(message: MessagingPayload,
                           topic: string,
                           options: MessagingOptions): Promise<admin.messaging.MessagingTopicResponse> {
        this.loggingService.info(`Sending notification to topic ${topic} with content : ${JsonHelper.stringify(message)}`);

        return this.app.messaging().sendToTopic(topic, message, options);
    }

    getDatabase(): firebase.database.Database {
        return this.app.database();
    }

}
