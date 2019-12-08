import { Configuration } from "../models";

export interface IConfigurationService {
    getConfiguration(): Promise<Configuration>;
}
