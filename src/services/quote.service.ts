import { injectable, inject } from 'inversify';
import { Quote, Configuration } from '../models';
import { IQuoteService, IAWSConfigurationService, IAppConfigurationService } from '../interfaces';
import { SERVICE_IDENTIFIERS } from '../constants';

@injectable()
export class QuoteService implements IQuoteService
{

    public constructor(
        @inject(SERVICE_IDENTIFIERS.IAPP_CONFIGURATION_SERVICE) private readonly appConfigurationService: IAppConfigurationService,
        @inject(SERVICE_IDENTIFIERS.IAWS_CONFIGURATION_SERVICE) private readonly awsConfigurationService: IAWSConfigurationService
    )
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
