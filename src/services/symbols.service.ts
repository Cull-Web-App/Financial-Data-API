import { injectable, inject } from 'inversify';
import { IEXSymbolResponseItem } from '../models';
import { IAWSConfigurationService, IIEXService, ISymbolsService } from '../interfaces';
import { SERVICE_IDENTIFIERS, TABLES } from '../constants';
import { partitionArray } from '../utils';

@injectable()
export class SymbolsService implements ISymbolsService
{
    public constructor(
        @inject(SERVICE_IDENTIFIERS.IAWS_CONFIGURATION_SERVICE) private readonly awsConfigurationService: IAWSConfigurationService,
        @inject(SERVICE_IDENTIFIERS.IIEX_SERVICE) private readonly iexService: IIEXService)
    {
    }

    public async updateSymbolsToLatest(): Promise<void>
    {
        const symbolsItems: IEXSymbolResponseItem[] = await this.iexService.getAllSymbolsResponseItems();

        console.log(`Attempting batch write of items to ${TABLES.SYMBOLS} table`);
        
        try
        {
            // Do a batch dump into the symbols table -- this may have provisioned throughput issues
            const symbolPartitions: IEXSymbolResponseItem[][] = partitionArray(symbolsItems, 25);
            await Promise.allSettled(
                symbolPartitions.map(partition => this.awsConfigurationService.documentClient.batchWrite({
                    RequestItems: {
                        [`${TABLES.SYMBOLS}-${process.env.NODE_ENV}`]: partition.map(item => ({
                            PutRequest: {
                                Item: item
                            }
                        }))
                    }
                }).promise())
            );
            return;
        }
        catch (err)
        {
            console.error('Batch write failed');
            console.error(err.toString());
            return Promise.reject();
        }
    }
}