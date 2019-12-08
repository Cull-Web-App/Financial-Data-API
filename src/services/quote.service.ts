import axios, { AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';
import { injectable } from 'inversify';
import { Quote } from '../models';
import CONFIG from '../config';
import { IQuoteService } from '../interfaces';

@injectable()
export class QuoteService implements IQuoteService {

    public async getSingleQuoteAtInterval(symbol: string, date: Date, interval: string): Promise<Quote> {

    }
    
    public async getQuotesAtInterval(): Promise<Array<Quote>> {
    
    }
    
    public async updateQuoteForAsset(): Promise<Quote> {
    
    }
    
    public async batchUpdateQuotesForAssets(): Promise<Array<Quote>> {
    
    }
}
