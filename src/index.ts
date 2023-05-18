import { StudentParser } from "./parsers/index.js";
// import { writeFileSync } from "fs";

async function main(){
    const files = "E20_BTECH_II_1107.pdf, E21_BTECH_IV_1251.pdf, E22_BTECH_VI.pdf, O19_BTECH_1_1015.pdf, O20_BTECH_1183.pdf, O21_BTECH_V.pdf".split(", ")
    for(const file of files){
        
        const pj = new StudentParser(`pdfs/${file}`);
        
        await pj.readPDF();
        await pj.parsePages();
        // writeFileSync(`generated_files/${file.slice(0, -4)}.json`, JSON.stringify(pj.students))
        
        let total = 0
        
        console.log(file)
        console.log("Total number of students = ", pj.students.length)
        console.log("Students with empty grade : ")
        
        pj.students.forEach((student, i) => {
            if (student.semester.subjects.some(sub => sub.grade === "")){
                console.log(i, student.rollno, student.name);
                total++;
            }
        })
        
        console.log("Number of students with empty grade =", total);
        console.log()
    };
}

await main()