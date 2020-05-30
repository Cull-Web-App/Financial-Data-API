import { injectable, inject } from 'inversify';
import { Quote } from '../models';
import { IQuoteService, IAWSConfigurationService, IIEXService } from '../interfaces';
import { SERVICE_IDENTIFIERS, TABLES } from '../constants';
import { DynamoDB } from 'aws-sdk';

@injectable()
export class QuoteService implements IQuoteService
{
    public constructor(
        @inject(SERVICE_IDENTIFIERS.IAWS_CONFIGURATION_SERVICE) private readonly awsConfigurationService: IAWSConfigurationService,
        @inject(SERVICE_IDENTIFIERS.IIEX_SERVICE) private readonly iexService: IIEXService)
    {
    }

    public async getSingleQuoteAtInterval(symbol: string, date: Date, interval: string): Promise<Quote>
    {
        // Retrieve the item -- partition key is symbol, sort is the dateTime (should go to seconds)
        const response: DynamoDB.GetItemOutput = await this.awsConfigurationService.documentClient.get({
            TableName: `${TABLES.QUOTES}-${process.env.NODE_ENV}`,
            Key: {
                symbol,
                dateTime: date.toISOString()
            }
        }).promise();

        // Map the dynamo output to the Quote type
        return DynamoDB.Converter.unmarshall((response.Item as DynamoDB.AttributeMap)) as Quote;
    }
    
    public async getQuotesAtInterval(symbol: string, startDate: Date, endDate: Date, interval: string): Promise<Array<Quote>>
    {
        const response: DynamoDB.QueryOutput = await this.awsConfigurationService.documentClient.query({
            TableName: `${TABLES.QUOTES}-${process.env.NODE_ENV}`,
            KeyConditionExpression: 'symbol = :symbol AND dateTime BETWEEN :startDate AND :endDate',
            ExpressionAttributeValues: {
                ':symbol': symbol,
                ':startDate': startDate.toISOString(),
                ':endDate': endDate.toISOString()
            }
        }).promise();

        // Unmarshall the response to get the quote array
        return (response.Items as DynamoDB.ItemList).map(quote => DynamoDB.Converter.unmarshall(quote) as Quote)
    }
    
    public async updateQuoteForAsset(symbol: string): Promise<Quote>
    {
        const quote: Quote = await this.iexService.retrieveQuoteFromProvider(symbol);

        console.log(`Retrieved quote for ${symbol} for the latest time. Preparing to add in DynamoDB`);

        try
        {
            await this.awsConfigurationService.documentClient.put({
                TableName: `${TABLES.QUOTES}-${process.env.NODE_ENV}`,
                Item: {
                    ...quote
                }
            }).promise();

            // Ensure the structure of the quote before returning
            return quote;
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
            const symbols: string[] = await this.iexService.getAllSymbols();

            console.log('All symbols collected, creating batch requests. NOTE: If some requests fail the others will continue in the batch');
            return this.partialBatchUpdateQuotesForAssets(symbols);
        }
        catch (err)
        {
            console.error('Failed to complete batch update for the assets with below error');
            console.error(err.toString());
            return Promise.reject(err.toString());
        }
    }

    /**
     * This method basically updates the batch of symbols passed in.
     * May be useful to increase performance over the full batch update?
     * @param symbols
     */
    public async partialBatchUpdateQuotesForAssets(symbols: string[]): Promise<Map<string, Quote>>
    {
        console.log(`Starting batch update for ${symbols}`);
        try
        {
            // Wait for each quote request to either complete or reject -- need to batch into sets of 10 or less
            // to handle the service throttling
            // Use slice to create the windows
            const chunkedSymbols: string[][] = symbols.reduce((acc: string[][], symbol: string, index: number) => { 
                const chunkIndex: number = Math.floor(index / 10)
                
                if(!acc[chunkIndex]) {
                    acc[chunkIndex] = [] // start a new chunk
                }
                
                acc[chunkIndex].push(symbol)
                
                return acc;
            }, []);

            // Do the chunks consecutively and then flatten
            const nestedQuoteResults: PromiseSettledResult<Quote>[][] = [];
            for (const chunk of chunkedSymbols)
            {
                const chunkResult = await Promise.allSettled(
                    chunk.map(symbol => this.updateQuoteForAsset(symbol))
                );

                nestedQuoteResults.push(chunkResult);
            }

            // Flatten the nested results
            const quoteUpdateResults: PromiseSettledResult<Quote>[] = nestedQuoteResults.flat();

            // Need to filter based on the status of the updates. Some may have failed, but thats okay (sparse data and massive load)
            const quotes: Quote[] = quoteUpdateResults.reduce((acc: Quote[], curr: PromiseSettledResult<Quote>) => {
                if (curr.status === 'fulfilled')
                {
                    return [
                        ...acc,
                        curr.value
                    ];
                }
                else
                {
                    console.log(`Service failed for ${curr.reason} in batch update`);
                    return acc;
                }
            }, []);

            if (quotes.length === quoteUpdateResults.length)
            {
                // Every asset successfully completed the batch update
                console.log('Batch update completed for all symbols successfully.');
            }
            else if (quotes.length !== 0)
            {
                // Some assets successfully completed the batch update
                console.error('Batch update partially completed, some symbols failed. Check prior logs for reasons.');
            }
            else
            {
                // No assets completed their updates
                throw Error('Batch update failed for all symbols!! Check if the network is working or there is a scaling issue!!');
            }

            // Create the key value map using the quote's internal properties
            // dont use he symbols array as we dont know which symbols failed anymore
            return new Map<string, Quote>(quotes.map((quote) => [quote.symbol, quote]));
        }
        catch (err)
        {
            console.error('Failed to complete batch update for the assets with below error');
            console.error(err.toString());
            return Promise.reject(err.toString());
        }
    }
}
