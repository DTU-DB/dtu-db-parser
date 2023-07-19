import { PdfReader } from 'pdfreader';

type PDFSource = string | Buffer;
type PDFToken = {
	text: string,
	coords: Coords
};

abstract class PDFParser{
	private pageNum: number = 0;
	private pdf: PDFSource;
	private pages: Array<Array<PDFToken>> = []; 
	private pageData: Array<PDFToken> = [];
	private errorPages: Array<number> = [];
	
	constructor(pdf: PDFSource){
		this.pdf = pdf;
	}
	
	protected abstract parsePage(page: Array<PDFToken>): void;
	
	private itemCallback(err: Error, item: any, resolve: (value: void | PromiseLike<void>) => void, reject: (reason?: any) => void){
		if (!item){
			this.pages.push(this.pageData);
			this.pageData = [];
			resolve();
			return;
		}

		else if (item.page){
			this.pageNum = item.page;
			if (this.pageData.length){
				this.pages.push(this.pageData);
				this.pageData = [];
			}
		}

		else if (item.text){
			this.pageData.push({text: item.text.trim(), coords: {x: item.x, y: item.y}});
		}

		else if (err) reject(console.error('error:', err));
	} 

	public async readPDF(): Promise<void>{
		const reader = new PdfReader();
		let parser: (pdf: PDFSource, callback_fn: (err: Error, item: any) => void) => void; 

		if (typeof this.pdf === 'string'){
			parser = reader.parseFileItems.bind(reader);
		}
		else{
			parser = reader.parseBuffer.bind(reader);
		}

		return new Promise<void>((resolve, reject) => {
			parser(this.pdf, (err, item) => {
				this.itemCallback(err, item, resolve, reject);
			});
		});
	}

	public parsePages(): void{
		this.pages.forEach((page, i) => {
			// if(i === 0){
			//     this.parsePage(page)
			// }
			try {
				this.parsePage(page);
			} catch (error){
				this.errorPages.push(i+1);
			}
		});
		if (this.errorPages.length !== 0){
			throw new Error(`Unable to parse Pages ${this.errorPages}`);
		}
	}

}

export {
	PDFSource,
	PDFToken,
	PDFParser
};