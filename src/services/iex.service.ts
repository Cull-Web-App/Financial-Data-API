import { injectable, inject } from 'inversify';
import { Quote, IEXSymbolResponseItem } from '../models';
import { IAppConfigurationService, IIEXService } from '../interfaces';
import { SERVICE_IDENTIFIERS } from '../constants';
import axios, { AxiosResponse } from 'axios';

@injectable()
export class IEXService implements IIEXService
{
    public constructor(
        @inject(SERVICE_IDENTIFIERS.IAPP_CONFIGURATION_SERVICE) private readonly appConfigurationService: IAppConfigurationService)
    {
    }

    public async getAllSymbolsResponseItems(): Promise<IEXSymbolResponseItem[]>
    {
        const { apiConfig, envConfig } = await this.appConfigurationService.getAllConfiguration();

        try
        {
            const response: AxiosResponse = await axios.get(`${apiConfig.DATA_SOURCE_URL}ref-data/symbols`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                params: {
                    token: envConfig.IEX_TOKEN
                }
            });
            return response.data;
        }
        catch (err)
        {
            console.error('Failed to load symbols');
            console.error(err.toString());
            return Promise.reject(err.toString());
        }
    }

    public async getAllSymbols(): Promise<string[]>
    {
        const symbolResponseItems: IEXSymbolResponseItem[] = await this.getAllSymbolsResponseItems();
        return symbolResponseItems.map(item => item.symbol);
    }

    public async retrieveQuoteFromProvider(symbol: string): Promise<Quote>
    {
        const { apiConfig, envConfig } = await this.appConfigurationService.getAllConfiguration();
        console.log(`Retrieving latest quote for ${symbol} from the IEX Provider. WARNING: Quotes are immutable, this action cannot be reversed.`);

        try
        {
            const quoteResponse: AxiosResponse = await axios.get(`${apiConfig.DATA_SOURCE_URL}stock/${symbol}/quote`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                params: {
                    token: envConfig.IEX_TOKEN
                }
            });

            return {
                symbol,
                high: quoteResponse.data.high,
                low: quoteResponse.data.low,
                open: quoteResponse.data.open,
                close: quoteResponse.data.close,
                volume: quoteResponse.data.volume,
                dateTime: new Date(quoteResponse.data.latestTime).toISOString()
            } as Quote;
        }
        catch (err)
        {
            console.error(`Failed to retrieve quote for ${symbol} from IEX Provider with following error. Have you run out of free requests?`);
            console.error(err.toString());
            return Promise.reject(err.toString());
        }
    }
}