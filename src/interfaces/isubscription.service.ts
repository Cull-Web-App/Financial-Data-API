import { Quote, Subscription } from "../models";

export interface ISubscriptionService
{
    getAllClientConnectionInfo(): Promise<Map<string, Subscription>>;
    getSubscribedSymbols(connectionId: string): Promise<Array<string>>;
    createSubscriptions(connectionId: string, symbolsToSub: Array<string>, interval: string): Promise<Array<string>>;
    deleteSubscriptions(connectionId: string, symbolsToUnsub: Array<string>): Promise<Array<string>>;
    deleteAllSubscriptions(connectionId: string): Promise<boolean>;
    sendMessageToClient(connectionId: string, message: string): Promise<void>;
}
