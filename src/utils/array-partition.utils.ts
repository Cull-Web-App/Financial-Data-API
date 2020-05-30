export const partitionArray = (arr: any[], partitionSize: number): any[][] => {
    return arr.reduce((acc: any[][], symbol: any, index: number) => { 
        const chunkIndex: number = Math.floor(index / partitionSize)
        
        if(!acc[chunkIndex]) {
            acc[chunkIndex] = []; // start a new chunk
        }
        
        acc[chunkIndex].push(symbol)
        
        return acc;
    }, []);
};
