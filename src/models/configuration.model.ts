import { EnvConfiguration } from "./env-configuration.model";
import { ApiConfiguration } from "./api-configuration.model";

export interface Configuration
{
    envConfig: EnvConfiguration;
    apiConfig: ApiConfiguration;
}
