import { PDFParser } from "./PDFParser.js"
import * as fs from "fs";


async function main(){
    let pj = new PDFParser("O19_BTECH_1_1015.pdf")
    await pj.readPDF();
    await pj.parsePages()
    console.log(pj.students.length)
    fs.writeFile('../test.json', JSON.stringify(pj.students), (err) => {
        if (err) throw err
    });
    
    // pj.students.forEach((student, i) => {
    //     student.semester.subjects.forEach(sub => {
    //         if (sub.grade == '') console.log(i, student.rollno) 
    //     })
    // })
}

main()