# DTU DB PARSER
This is the improved DTU DB Parser, written from scratch using TypeScript. This module parses a DTU result PDF file, and returns the list of student results.

This is a part of the overall DTU DB project.

## How to use
1. Install the extension from Github.
```bash
$ npm install unknownblueguy6/dtu-db-parser
```

2. Import it into your TypeScript project.
```ts
import  { Parsers } from "dtu-db-parser";

async function main(){
    // pdf can be in the form of a byte buffer, or a file path
    const pdf: PDFSource = "result.pdf";
    const parser = new Parsers.StudentParser(pdf);
    
    await parser.readPDF();
    
    const students: Array<Student> = await parser.parsePages();
    
    console.log(students[0]);
}

await main();
```
