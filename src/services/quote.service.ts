import { injectable, inject } from 'inversify';
import { Quote } from '../models';
import { IQuoteService, IAWSConfigurationService, IAppConfigurationService } from '../interfaces';
import { SERVICE_IDENTIFIERS, TABLES } from '../constants';
import { DynamoDB } from 'aws-sdk';
import axios from 'axios';

@injectable()
export class QuoteService implements IQuoteService
{
    public constructor(
        @inject(SERVICE_IDENTIFIERS.IAPP_CONFIGURATION_SERVICE) private readonly appConfigurationService: IAppConfigurationService,
        @inject(SERVICE_IDENTIFIERS.IAWS_CONFIGURATION_SERVICE) private readonly awsConfigurationService: IAWSConfigurationService)
    {

    }

    public async getSingleQuoteAtInterval(symbol: string, date: Date, interval: string): Promise<Quote>
    {
        // Retrieve the item -- partition key is symbol, sort is the dateTime (should go to seconds)
        const response: DynamoDB.GetItemOutput = await this.awsConfigurationService.documentClient.get({
            TableName: TABLES.QUOTES,
            Key: {
                symbol,
                dateTime: date
            }
        }).promise();

        // Map the dynamo output to the Quote type
        return DynamoDB.Converter.unmarshall((response.Item as DynamoDB.AttributeMap)) as Quote;
    }
    
    public async getQuotesAtInterval(symbol: string, startDate: Date, endDate: Date, interval: string): Promise<Array<Quote>>
    {
        const response: DynamoDB.QueryOutput = await this.awsConfigurationService.documentClient.query({
            TableName: TABLES.QUOTES,
            KeyConditionExpression: 'symbol = :symbol AND dateTime BETWEEN :startDate AND :endDate',
            ExpressionAttributeValues: {
                ':symbol': symbol,
                ':startDate': startDate,
                ':endDate': endDate
            }
        }).promise();

        // Unmarshall the response to get the quote array
        return (response.Items as DynamoDB.ItemList).map(quote => DynamoDB.Converter.unmarshall(quote) as Quote)
    }

    public async retrieveQuoteFromProvider(symbol: string): Promise<Quote>
    {
        console.log(`Retrieving latest quote for ${symbol} from the IEX Provider. WARNING: Quotes are immutable, this action cannot be reversed.`);

        const { apiConfig, envConfig } = await this.appConfigurationService.getAllConfiguration();
        try
        {
            return await axios.get(`${apiConfig.DATA_SOURCE_URL}${symbol}/quote`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                params: {
                    token: envConfig.IEX_TOKEN
                }
            });
        }
        catch (err)
        {
            console.error(`Failed to retrieve quote for ${symbol} from IEX Provider with following error. Have you run out of free requests?`);
            console.error(err.toString());
            return Promise.reject(err.toString());
        }
    }
    
    public async updateQuoteForAsset(symbol: string): Promise<Quote>
    {
        const quote: Quote = await this.retrieveQuoteFromProvider(symbol);

        console.log(`Retrieved quote for ${symbol} for the latest time. Preparing to add in DynamoDB`);

        try
        {
            const createdQuote: DynamoDB.PutItemOutput = await this.awsConfigurationService.documentClient.put({
                TableName: TABLES.QUOTES,
                Item: {
                    ...quote
                }
            }).promise();

            // Ensure the structure of the quote before returning
            return DynamoDB.Converter.unmarshall(createdQuote.Attributes as DynamoDB.AttributeMap) as Quote;
        }
        catch (err)
        {
            console.error(`Failed to update quote for ${symbol} in DynamoDB with following error.`);
            console.error(err.toString());
            return Promise.reject(err.toString());
        }
    }
    
    public async batchUpdateQuotesForAssets(): Promise<Map<string, Quote>>
    {
        console.log('Collecting all the asset symbols to be updated in the batch');

        try
        {
            const symbols = ;

            console.log('All symbols collected, creating batch requests. NOTE: If some requests fail the others will continue in the batch');

            // Wait for each quote request to either complete or reject
            const quotes: Quote[] = await Promise.allSettled(symbols.map(symbol => this.updateQuoteForAsset(symbol)));
            return new Map<string, Quote>(quotes.map((quote, i) => [symbols[i], quote]));
        }
        catch (err)
        {
            console.error('Failed to complete batch update for tthe assets with below error');
            console.error(err.toString());
            return Promise.reject(err.toString());
        }
    }
}
