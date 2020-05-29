import { Quote } from "../models";

export interface IQuoteService
{
    getSingleQuoteAtInterval(symbol: string, date: Date, interval: string): Promise<Quote>;
    getQuotesAtInterval(symbol: string, startDate: Date, endDate: Date, interval: string): Promise<Array<Quote>>;
    updateQuoteForAsset(symbol: string): Promise<Quote>;
    batchUpdateQuotesForAssets(): Promise<Map<string, Quote>>;
    partialBatchUpdateQuotesForAssets(symbols: string[]): Promise<Map<string, Quote>>;
}
