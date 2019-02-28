import {Service} from 'typedi';
import {LoggingService} from '../common/logging';
import {CircularIterator} from '../common/helpers/circular-iterator';
import {TabtService} from '../common/tabt/tabt-service';
import {filter, map, mergeMap, takeUntil, withLatestFrom} from 'rxjs/operators';
import {Subject} from 'rxjs/internal/Subject';
import {interval} from 'rxjs/internal/observable/interval';
import {FirebaseService} from '../common/firebase/firebase-service';
import {ConfigurationService} from '../config';
import {GetMatchesRequest, TeamMatchEntry} from '../common/tabt/models';
import {forkJoin} from 'rxjs/internal/observable/forkJoin';
import {FirebaseSnapshot} from '../common/helpers/firebase-snapshot';
import {JsonHelper} from '../common/helpers';
import {TabtSubscription, TabtSubscriptionType} from '../master/subscription-model';

const dateFormat = require('dateformat');

@Service()
export class WorkerNotification {

    private subscriptions: CircularIterator<TabtSubscription>;
    private newSub$: Subject<TabtSubscription>;
    private stopInterval$: Subject<any>;
    private subscriptionIterator: IterableIterator<TabtSubscription>;

    constructor(
        private loggingService: LoggingService,
        private tabtService: TabtService,
        private firebaseService: FirebaseService,
        private configurationService: ConfigurationService) {

        this.newSub$ = new Subject<TabtSubscription>();
        this.stopInterval$ = new Subject<any>();
        this.initDivisions();
        this.start();
    }

    initDivisions() {
        this.subscriptions = new CircularIterator<TabtSubscription>();
        this.subscriptionIterator = this.subscriptions.values();
    }

    start() {
        const intervalConfig = this.configurationService.config.interval_refresh;
        const intervalTime = Math.round(Math.random() * intervalConfig + intervalConfig / 1.5);
        this.loggingService.trace(`Interval time ${intervalTime}`);
        interval(intervalTime).pipe(
            withLatestFrom(this.newSub$),
            takeUntil(this.stopInterval$),
            map(() => this.subscriptionIterator.next()), // Take next Division to test
            filter((currentSubscription: IteratorResult<TabtSubscription>) => currentSubscription.done === false), // Should not happen ;)
            map((currentSubscription: IteratorResult<TabtSubscription>) => currentSubscription.value),
            mergeMap((currentSubscription: TabtSubscription) =>
                forkJoin(
                    this.firebaseService.getDatabase().ref('/notifications/sent').once('value')
                        .then(ds => FirebaseSnapshot.SnapshotToArray<string>(ds)),
                    this.getDailyMatchesMatchOfSubscription(currentSubscription)
                ).pipe(
                    map(([notificationsAlreadySent, matches]) => ({
                        currentSubscription,
                        matchesToNotify: matches.filter(match => match.Score && !notificationsAlreadySent.includes(match.MatchId))
                    }))
                )) // ,
            // filter(({currentDivision, matchesToNotify}) => matchesToNotify.length > 0)
        ).subscribe(({currentSubscription, matchesToNotify}) => {
            for (const match of matchesToNotify) {
                // this.firebaseService.sendNotifications()
                this.firebaseService.getDatabase().ref('/notifications/sent').push(match.MatchId, (error: Error) => {
                    if (error) {
                        this.loggingService.error(`Error when saving notification flag for match ${match.MatchId}`, error);
                        return;
                    }
                    this.loggingService.info(`Notification flag saved for match ${match.MatchId}`);
                });
                this.loggingService.info(
                    `Should notifiy ${JsonHelper.stringify(match.MatchId)} for subscription ${currentSubscription.type} ${currentSubscription.id}`);
            }
        });
    }

    async addSubscriptionAsync(subscription: TabtSubscription) {
        this.loggingService.trace(`Checking if subscription ${subscription.type}-${subscription.id} is interesting for today`);
        const matches = await this.getDailyMatchesMatchOfSubscription(subscription);

        if (matches.length > 0) {
            this.loggingService.info(`Subscription ${subscription.type}-${subscription.id} is interesting for today`);
            this.subscriptions.add(subscription);
            this.newSub$.next(subscription);
        } else {
            this.loggingService.error(`Subscription ${subscription.type}-${subscription.id} is not interesting for today`);
            throw Error(`Subscription ${subscription.type}-${subscription.id} is not interesting for today`);
        }
    }

    stop() {
        this.loggingService.info('Stopping notifications worker');
        this.stopInterval$.next();
    }

    reset() {
        this.loggingService.info('Reset notifications worker');

        this.stop();
        this.initDivisions();
        this.start();
    }

    private getDailyMatchesMatchOfSubscription(subscription: TabtSubscription): Promise<TeamMatchEntry[]> {
        const matchRequest = new GetMatchesRequest();
        if (subscription.type === TabtSubscriptionType.DIVISION) {
            matchRequest.DivisionId = Number(subscription.id);
        } else if (subscription.type === TabtSubscriptionType.CLUB) {
            matchRequest.Club = subscription.id;
        } else {
            throw new Error(`Unknown subscription type [${subscription.type}]`);
        }

        matchRequest.YearDateFrom = '2018-11-03';
        matchRequest.YearDateTo = '2018-11-04';

        //matchRequest.YearDateTo = dateFormat(new Date(), 'yyyy-mm-dd');
        //matchRequest.YearDateFrom = dateFormat(new Date().setDate(new Date().getDate() - 1), 'yyyy-mm-dd');

        this.loggingService.info(
            `Getting matches from ${matchRequest.YearDateFrom} to ${matchRequest.YearDateTo} for subscription ${subscription.type}-${subscription.id}`);

        return this.tabtService.getMatches(matchRequest);
    }

}
