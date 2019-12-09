import { injectable, inject } from 'inversify';
import { Quote, Configuration } from '../models';
import { IQuoteService } from '../interfaces';
import { SERVICE_IDENTIFIERS } from '../constants';

@injectable()
export class QuoteService implements IQuoteService
{

    public constructor(@inject(SERVICE_IDENTIFIERS.CONFIGURATION) private readonly configuration: Configuration)
    {

    }

    public async getSingleQuoteAtInterval(symbol: string, date: Date, interval: string): Promise<Quote>
    {
        throw new Error();
    }
    
    public async getQuotesAtInterval(symbol: string, startDate: Date, endDate: Date, interval: string): Promise<Array<Quote>>
    {
        throw new Error();
    }
    
    public async updateQuoteForAsset(symbol: string): Promise<Quote>
    {
        throw new Error();
    }
    
    public async batchUpdateQuotesForAssets(): Promise<Map<string, Quote>>
    {
        throw new Error();
    }
}
