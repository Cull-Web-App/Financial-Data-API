import { Configuration } from "../models";

export interface IAppConfigurationService
{
    getConfiguration(): Promise<Configuration>;
}
