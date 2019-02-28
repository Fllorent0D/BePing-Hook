import {Service} from 'typedi';
import {ConfigurationService} from '../../config';
import {LoggingService} from '../logging';

import {
    ClubEntry,
    DivisionEntry,
    GetClubsRequest,
    GetClubTeamsRequest,
    GetDivisionRankingRequest,
    GetDivisionsRequest,
    GetMatchesRequest,
    GetMembersRequest,
    GetSeasonsResponse,
    GetTournamentsRequest,
    IRequest,
    MemberEntry,
    RankingEntry,
    TeamEntry,
    TeamMatchEntry,
    TestRequest,
    TestResponse,
    TournamentEntry
} from '../tabt';

const _ = require('lodash');
const fetch = require('node-fetch');
const randomIpv4 = require('random-ipv4');

@Service()
export class TabtService {
    private currentIp: string;
    private tabtUrl: string;

    constructor(private configuration: ConfigurationService, private loggerService: LoggingService) {
        this.reloadIp();
        this.tabtUrl = this.configuration.config.tabt.url;
    }

    public getSeasons(): Promise<GetSeasonsResponse> {
        return this.callUrl('/seasons');
    }

    public getClubTeams(club: string, args: GetClubTeamsRequest): Promise<TeamEntry[]> {
        return this.callUrl(`/clubs/${club}/teams`, args);
    }

    public getDivisionRanking(divisionId: string, args: GetDivisionRankingRequest): Promise<RankingEntry[]> {
        return this.callUrl(`/divisions/${divisionId}/ranking`, args);
    }

    public getMatches(args: GetMatchesRequest): Promise<TeamMatchEntry[]> {
        return this.callUrl('/matchs', args);
    }

    public getMembers(args: GetMembersRequest): Promise<MemberEntry[]> {
        return this.callUrl('/membres', args);
    }

    public getClubs(args: GetClubsRequest): Promise<ClubEntry[]> {
        return this.callUrl('/clubs', args);
    }

    public getDivisions(args: GetDivisionsRequest): Promise<DivisionEntry[]> {
        return this.callUrl('/divisions', args);
    }

    public getTournaments(args: GetTournamentsRequest): Promise<TournamentEntry[]> {
        return this.callUrl('/tournaments', args);
    }

    public getTournament(tournamentId: string, args: GetTournamentsRequest): Promise<TournamentEntry[]> {
        return this.callUrl(`/tournaments/${tournamentId}`, args);
    }

    public testRequest(args: TestRequest): Promise<TestResponse> {
        return this.callUrl('/test', args);
    }

    private async callUrl(url: string, args?: IRequest, maxRetry: number = 5): Promise<any> {

        const argmentifiedUrl = url
            .split('/')
            .map((part: string) => {
                if (part.charAt(0) === ':') {
                    let expectedParam: string = _.chain(part)
                        .replace(':', '')
                        .startCase()
                        .replace(new RegExp(' ', 'g'), '')
                        .value();
                    const isOptional: boolean = expectedParam.charAt(expectedParam.length) === '?';

                    if (isOptional) {
                        expectedParam = expectedParam.slice(0, -1);
                    }

                    const valueParam = _.get(args, expectedParam, null);

                    if (valueParam !== null) {
                        _.omit(args, expectedParam);

                        return valueParam;
                    } else if (isOptional) {
                        return '';
                    } else {
                        throw new Error('Parameter not found in arguments.');
                    }
                }

                return part;
            }).join('/');

        const queryString = _.chain(args)
            .toPairsIn()
            .map(([key, value]: [string, string]) => `${_.camelCase(encodeURIComponent(key))}=${encodeURIComponent(value)}`)
            .join('&')
            .value();

        const urlToCall = `${this.tabtUrl}/api${argmentifiedUrl}?${queryString}`;

        return fetch(urlToCall, {
            headers: {
                'x-frenoy-login': 'floca',
                'x-frenoy-password': 'fca-1995',
                'x-frenoy-database': 'aftt',
                'x-forwarded-for': this.currentIp
            }
        }).then(async (res: any) => {
            if (res.status === 200) {
                return res.json();
            } else if (maxRetry > 0) {

                this.reloadIp();
                this.loggerService.info(`Changing IP to ${this.currentIp}...`);

                return this.callUrl(url, args, maxRetry - 1);
            } else {
                throw new Error(await res.text());
            }
        });

    }

    private reloadIp() {
        this.currentIp = randomIpv4('{token1}.{token2}.{token3}.{token4}', {
            token1: {
                min: 127,
                max: 127
            },
            token2: {
                min: 127,
                max: 192
            },
            token3: {
                min: 0,
                max: 200
            },
            token4: {
                min: 0,
                max: 200
            }
        });
    }

}
