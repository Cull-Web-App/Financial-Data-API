import { Lambda } from 'aws-sdk';
import { injectable, inject } from 'inversify';
import { Configuration, ApiConfiguration, EnvConfiguration } from '../models';
import { IAppConfigurationService, IAWSConfigurationService } from '../interfaces';
import { SERVICE_IDENTIFIERS } from '../constants';

@injectable()
export class AppConfigurationService implements IAppConfigurationService
{
    private configuration: Configuration = <Configuration> {};

    public constructor(
        @inject(SERVICE_IDENTIFIERS.IAWS_CONFIGURATION_SERVICE) private readonly awsConfigurationService: IAWSConfigurationService)
    {
    }

    public async getApiConfiguration(): Promise<ApiConfiguration>
    {
        if (!this.configuration.apiConfig)
        {
            const response: Lambda.InvocationResponse = await this.awsConfigurationService.lambda.invoke({
                FunctionName: `configuration-api-${process.env.NODE_ENV}-getApiConfigForEnv`
            }).promise();
        
            // Map the configuration to the type -- cache the result for future use -- prevents DI issue
            this.configuration.apiConfig = JSON.parse(response.Payload as string).config as ApiConfiguration;
        }
        return this.configuration.apiConfig;
    }

    public async getEnvConfiguration(): Promise<EnvConfiguration>
    {
        if (!this.configuration.envConfig)
        {
            const response: Lambda.InvocationResponse = await this.awsConfigurationService.lambda.invoke({
                FunctionName: `configuration-api-${process.env.NODE_ENV}-getEnvConfigForEnv`
            }).promise();
        
            // Map the configuration to the type -- cache the result for future use -- prevents DI issue
            this.configuration.envConfig = JSON.parse(response.Payload as string).config as EnvConfiguration;
        }
        return this.configuration.envConfig;
    }

    public async getAllConfiguration(): Promise<Configuration>
    {
        if (!this.configuration.apiConfig || !this.configuration.envConfig)
        {
            const response: Lambda.InvocationResponse = await this.awsConfigurationService.lambda.invoke({
                FunctionName: `configuration-api-${process.env.NODE_ENV}-getAllConfigsForEnv`
            }).promise();
        
            // Map the configuration to the type -- cache the result for future use -- prevents DI issue
            this.configuration = JSON.parse(JSON.parse(response.Payload as string).body) as Configuration;
        }

        // Return the cached configuration -- in context this should be quick and avoid circular DI issue
        return this.configuration;
    }
}
