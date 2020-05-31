import { IEXSymbolResponseItem, Quote } from "../models";

export interface IIEXService
{
    getAllSymbolsResponseItems(): Promise<IEXSymbolResponseItem[]>;
    getAllSymbols(): Promise<string[]>;
    retrieveQuoteFromProvider(symbol: string): Promise<Quote>;
    retrieveQuotesFromProvider(symbols: string[], chunkSize?: number): Promise<Quote[]>;
}