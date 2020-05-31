import { injectable, inject } from 'inversify';
import { Quote } from '../models';
import { IQuoteService, IAWSConfigurationService, IIEXService } from '../interfaces';
import { SERVICE_IDENTIFIERS, TABLES } from '../constants';
import { DynamoDB } from 'aws-sdk';
import { partitionArray } from '../utils';

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

    public async updateQuotesForAssets(symbols: string[], chunkSize: number = 25): Promise<Quote[]>
    {
        const quotes: Quote[] = await this.iexService.retrieveQuotesFromProvider(symbols);

        console.log(`Preparing to write ${quotes} to DynamoDB in batches`);

        try
        {
            // Handle this as an actual batchWrite to improve the perf. Max write size is 25
            const quoteChunks: Quote[][] = partitionArray(quotes, chunkSize);
            for (const chunk of quoteChunks)
            {
                console.log(`Batch writing ${JSON.stringify(chunk)} to ${TABLES.QUOTES}-${process.env.NODE_ENV}`);
                const batchWriteResult: DynamoDB.BatchWriteItemOutput = await this.awsConfigurationService.documentClient.batchWrite({
                    RequestItems: {
                        [`${TABLES.QUOTES}-${process.env.NODE_ENV}`]: chunk.map(quote => ({
                            PutRequest: {
                                Item: quote
                            }
                        }))
                    }
                }).promise();

                console.log(`Batch write sucessful. Output: ${JSON.stringify(batchWriteResult)}`);
            }

            // Ensure the structure of the quote before returning
            return quotes
        }
        catch (err)
        {
            console.error(`Failed to update quote for ${symbols} in DynamoDB with following error.`);
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
            return this.partialBatchUpdateQuotesForAssets(symbols.slice(400, 700));
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
            // Flatten the nested results
            const quoteUpdateResults: Quote[] = await this.updateQuotesForAssets(symbols);

            if (symbols.length === quoteUpdateResults.length)
            {
                // Every asset successfully completed the batch update
                console.log('Batch update completed for all symbols successfully.');
            }
            else if (quoteUpdateResults.length !== 0)
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
            return new Map<string, Quote>(quoteUpdateResults.map((quote) => [quote.symbol, quote]));
        }
        catch (err)
        {
            console.error('Failed to complete batch update for the assets with below error');
            console.error(err.toString());
            return Promise.reject(err.toString());
        }
    }
}
