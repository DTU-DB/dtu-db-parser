import { PDFParser } from "./PDFParser.js"
import * as fs from "fs";


async function main(){
    let pj = new PDFParser("E22_BTECH_VI.pdf")
    await pj.readPDF();
    // console.log('readpdf')
    // console.log(pj.pages[0])
    await pj.parsePages()
    // pj.parsePageNew(pj.pages[0])
    console.log(pj.students.length)
    // fs.writeFile('../testnew.json', JSON.stringify(pj.students), (err) => {
    //     if (err) throw err
    // });
    let total = 0
    pj.students.forEach((student, i) => {
        if (student.semester.subjects.some(sub => sub.grade === "")){
            console.log(student.name);
            total++;
        }
    })
    console.log(total);

}

main()