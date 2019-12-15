import { Lambda } from 'aws-sdk';
import { injectable, inject } from 'inversify';
import { Configuration } from '../models';
import { IAppConfigurationService, IAWSConfigurationService } from '../interfaces';
import { SERVICE_IDENTIFIERS } from '../constants';

@injectable()
export class AppConfigurationService implements IAppConfigurationService
{
    private configuration: Configuration | undefined;

    public constructor(@inject(SERVICE_IDENTIFIERS.IAWS_CONFIGURATION_SERVICE) private readonly awsConfigurationService: IAWSConfigurationService)
    {

    }

    public async getConfiguration(): Promise<Configuration>
    {
        if (!this.configuration)
        {
            const response: Lambda.InvocationResponse = await this.awsConfigurationService.lambda.invoke({
                FunctionName: 'configuration-api-' + process.env.NODE_ENV + '-getConfigForEnv',
                Payload: JSON.stringify({
                    queryStringParameters: {
                        env: process.env.NODE_ENV
                    }
                })
            }).promise();
        
            // Map the configuration to the type -- cache the result for future use -- prevents DI issue
            this.configuration = JSON.parse(response.Payload as string) as Configuration;
        }

        // Return the cached configuration -- in context this should be quick and avoid circular DI issue
        return this.configuration;
    }
}
