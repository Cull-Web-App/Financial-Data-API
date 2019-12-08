import { Quote } from "../models";

export interface IQuoteService {
    getSingleQuoteAtInterval(): Promise<Quote>;
    getQuotesAtInterval(): Promise<Array<Quote>>;
    updateQuoteForAsset(): Promise<Quote>;
    batchUpdateQuotesForAssets(): Promise<Array<Quote>>;
}
