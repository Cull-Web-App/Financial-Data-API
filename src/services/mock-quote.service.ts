import axios, { AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';
import { Quote } from '../models';
import { } from '../config';

export class MockQuoteService {}

export const getSingleQuoteAtInterval = (symbol: string, date: Date, interval: string): Quote => {

};

export const getQuotesAtInterval = (): Array<Quote> => {

};

export const generateInitialQuote = (startDate: Moment): Quote => {
    const startOpen: number = Math.random() * (100 - 10) + 10;
    const startClose: number = startOpen * (Math.random() * (1.2 - 0.8) + 0.8);
    const startVolume: number = Math.random() * (1000000 - 50) + 50;
    const startHigh: number = startClose > startOpen ? startClose * (Math.random() * (1.2 - 1) + 1) : startOpen * (Math.random() * (1.2 - 1) + 1);
    const startLow: number = startClose > startOpen ? startClose * (Math.random() * (1 - 0.8) + 0.8) : startOpen * (Math.random() * (1 - 0.8) + 0.8);
    const startChange: number = startClose * (Math.random() * (.15));
    const startChangePercent: number = startChange/startClose;

    const startVals: Quote = {
        open: Number(startOpen.toFixed(5)),
        close: Number(startClose.toFixed(5)),
        dateTime: startDate.toISOString(),
        high: Number(startHigh.toFixed(5)),
        low: Number(startLow.toFixed(5)),
        volume: Number(startVolume.toFixed(5)),
        change: Number(startChange.toFixed(5)),
        changePercent: Number(startChangePercent.toFixed(5)) * 100
    };
    return startVals;
}

export const setInterval = (interval: string): number => {
    if (interval == 's')
    {
        return 1;
    }
    else if (interval == 'm')
    {
        return 8;
    }
    else if (interval == 'mm')
    {
        return 48;
    }
    else if (interval == 'h')
    {
        return 3600;
    }
    else
    {
        return 28800;
    }
}

export const generateNextQuote = (previous: Quote, seconds: number): Quote => {
    const open: number = previous.close;
    const close: number = open * (Math.random() * (1.2 - 0.8) + 0.8);
    const dateTime: string = moment(previous.dateTime).add(seconds,'s').toISOString();
    const high: number = close > open ? close * (Math.random() * (1.2 - 1) + 1) : open * (Math.random() * (1.2 - 1) + 1);
    const low: number = close > open ? close * (Math.random() * (1 - 0.8) + 0.8) : open * (Math.random() * (1 - 0.8) + 0.8);
    const change: number = close * (Math.random() * (0.15));
    const changePercent: number = change/close;
    const volume: number = previous.volume * (Math.random() * (1.2 - 0.8) + 0.8);

    return {
        open: Number(open.toFixed(5)),
        close: Number(close.toFixed(5)),
        dateTime: dateTime,
        high: Number(high.toFixed(5)),
        low: Number(low.toFixed(5)),
        volume: Number(volume.toFixed(5)),
        change: Number(change.toFixed(5)),
        changePercent: Number(changePercent.toFixed(5)) *100
    };    
}