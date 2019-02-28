import 'reflect-metadata';
import {Container} from 'typedi';
import {Cluster} from 'cluster';
import {MasterServer} from './master/master-server';
import {WorkerServer} from './worker/worker-server';
import {ServerHooks} from './common/helpers/server-hooks';
import {MasterSubscriptionsListener} from './master/master-subscriptions-listener';
import {MasterExpressServer} from './master/master-express-server';
import {MasterCronTasks} from './master/master-cron-tasks';

const cluster: Cluster = require('cluster');

const start = async (): Promise<void> => {
    if (cluster.isMaster) {
        await Container.get(MasterServer).startAsync();
        await Container.get(MasterExpressServer).startAsync();
        await Container.get(MasterCronTasks).startAsync();
        await Container.get(MasterSubscriptionsListener).startAsync();
    } else {
        await Container.get(WorkerServer).startAsync();
    }
};

ServerHooks.registerProcessHooks();
start()
    .catch(err => console.log(err));
