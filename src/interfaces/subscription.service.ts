import { Quote } from "../models";

export interface ISubscriptionService {
    getSubscribedSymbols(connectionId: string): Promise<Array<string>>;
    createSubscriptions(connectionId: string, symbolsToSub: Array<string>, interval: string): Promise<Array<string>>;
    deleteSubscriptions(connectionId: string, symbolsToUnsub: Array<string>): Promise<Array<string>>;
}
