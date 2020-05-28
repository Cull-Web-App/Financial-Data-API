import { Configuration, EnvConfiguration, ApiConfiguration } from "../models";

export interface IAppConfigurationService
{
    getEnvConfiguration(): Promise<EnvConfiguration>;
    getApiConfiguration(): Promise<ApiConfiguration>;
    getAllConfiguration(): Promise<Configuration>;
}
