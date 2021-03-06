export interface Configuration {
    isProduction: boolean;
    logging: {
        shortDescription: boolean;
        transports: any[];
    };
    environment: string;
    tabt: {
        url: string;
    };
    express: {
        port: number;
    };
    firebase: any;
    interval_refresh: number;
}
