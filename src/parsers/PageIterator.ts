import type { PDFToken } from "./PDFParser.js";

class PageIterator implements Iterator<PDFToken>{
    private page: Array<PDFToken>;
    private i = 0;

    public lastToken: PDFToken = {text: "", coords:{x: 0, y: 0}};

    constructor(page: Array<PDFToken>){
        this.page = page;
    }

    next(...args: [] | [undefined]): IteratorResult<PDFToken, any> {
        if (this.i < this.page.length){
            const result = {
                done: false,
                value: this.page[this.i],
            }
            this.i++;
            this.lastToken = this.page[this.i-1];
            return result;
        }
        else{
            return {
                done: true,
                value: undefined,
            }
        }
    }  
}

export {
    PageIterator
}