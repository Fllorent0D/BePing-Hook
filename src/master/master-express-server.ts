import {Service} from 'typedi';
import {LoggingService} from '../common/logging';
import {MasterWorkerCache} from './master-worker-cache';
import {ConfigurationService} from '../config';
import {MasterCommandHandler} from './master-command-handler';
import express = require('express');
import helmet = require('helmet');

@Service()
export class MasterExpressServer {
    public app: express.Application;

    constructor(
        private loggingService: LoggingService,
        private workerCache: MasterWorkerCache,
        private masterCommandHandler: MasterCommandHandler,
        private configurationService: ConfigurationService) {

    }

    startAsync() {
        this.app = express();
        this.config();
        this.routes();
        this.app.listen(this.configurationService.config.express.port, () => {
            this.loggingService.trace(`BePing backend app listening on port ${this.configurationService.config.express.port}!`);
        });
    }

    private config() {
        this.app.use(helmet());
    }

    private routes() {
        const router: express.Router = express.Router();
        router.get('/', (req: express.Request, res: express.Response) => {
            const worker = this.workerCache.displayCache();
            res.send(worker);
        });

        router.delete('/', async (req: express.Request, res: express.Response) => {
            await this.masterCommandHandler.execCleanListenerAsync();
            res.sendStatus(200);
        });

        this.app.use(router);
    }

}
