import { PdfReader } from "pdfreader";
import { Student } from "./interfaces/student";
import { deromanize } from "romans";

type PDFSource = string | Buffer;
type PDFToken = {text: string, x: number, y: number};

const PROGRAM_PREFIX_TOKEN_TEXT = "Program :";
const SEMESTER_PREFIX_TOKEN_TEXT = "Sem :";
const RESULT_BLOCK_TOKEN_TEXT = "Sr.No";
const SUBJECT_PREFIX_TOKEN_TEXT = "Credits";
const SUBJECT_INFO_REGEX = /:/;
const SUBJECT_CREDIT_PREFIX_TOKEN_TEXT = "Papers Failed";
const END_OF_PAGE_REGEX = /Page\s\d+/;

const VALID_GRADES = ["O", "A+", "A", "B+", "B", "C", "P", "F", "DT", "RW", "RL", "AB", "I", "UFM"];


class SubjectInfo{
    iter: number = 0;
    codes: Array<string> = [];
    names: Array<string> = [];
    credits: Array<number> = [];
    x: Array<number> = [];  // TODO: give better name
};

class StudentInfo{
    iter: number = 0;
    name: string = "";
    rollno: string = "";
    firstyearrollno: string = "";
    grades: Array<string> = [];
    totalcredits: number = 0;
    sgpa: number = 0;
    failed: Array<boolean> = []
};

interface MiscInfo{
    degree: string,
    currentsem: number
}


export class PDFParser{
    pageNum: number = 0;
    pdf: PDFSource;
    reader = new PdfReader();
    pages: Array<Array<PDFToken>> = []; 
    pageData: Array<PDFToken> = [];
    students: Array<Student> = [];
    
    constructor(pdf: PDFSource){
        this.pdf = pdf;
    }

    item_callback(err: Error, item: any, resolve: any, reject: any){
        if (!item){
            this.pages.push(this.pageData)
            this.pageData = [];
            resolve()
            return;
        }

        else if (item.page){
            this.pageNum = item.page;
            if (this.pageData){
                this.pages.push(this.pageData)
                this.pageData = [];
            }
        }

        else if (item.text){
            this.pageData.push({text: item.text.trim(), x: item.x, y: item.y});
        }

        else if (err) reject(console.error("error:", err));
    } 

    async readPDF(){
        let pdf_promise: Promise<void>;
        if (typeof this.pdf === 'string') pdf_promise = new Promise<void>((resolve, reject) => {
            this.reader.parseFileItems(this.pdf, (err: Error, item: any) => {
                this.item_callback(err, item, resolve, reject);
            });  
        });
        else pdf_promise = new Promise<void>((resolve, reject) => {
            this.reader.parseBuffer(this.pdf, (err: Error, item: any) => {
                this.item_callback(err, item, resolve, reject);
            });
        });
        return pdf_promise;
    }

    async parsePages(){
        let parse_promise = new Promise<void>((resolve) => {
            this.pages.forEach(page => this.parsePage(page));
            resolve();
        }) 
        return parse_promise;
    } 

    parsePage(page: Array<PDFToken>){
        let ignoreTokenNum: number = 0;
        let endFlag = false;
        let resultsFlag = false;
        
        let miscInfo: MiscInfo = {
            degree: "",
            currentsem: 0
        }
        
        let subjectFlag: boolean = false;
        let subjectInfo: SubjectInfo = new SubjectInfo()


        let studentFlag: boolean = false;
        let studentInfo: StudentInfo = new StudentInfo()
        
        page.forEach((token: PDFToken, i: number, data: Array<PDFToken>) => {
            if(endFlag) return;
            
            // console.log('"%s" \t (%d, %d)', token.text, token.x, token.y)
            
            if(ignoreTokenNum){
                --ignoreTokenNum;
                return;
            }
    
            if (!resultsFlag){
                if (token.text === PROGRAM_PREFIX_TOKEN_TEXT){
                    miscInfo.degree = data[i+1].text;
                    return
                }
                
                if (token.text === SEMESTER_PREFIX_TOKEN_TEXT){
                    miscInfo.currentsem = deromanize(data[i+1].text);
                    return
                }
    
                if (token.text === RESULT_BLOCK_TOKEN_TEXT){
                    resultsFlag = true;
                    return
                }
            }
    
            else {
                if (END_OF_PAGE_REGEX.test(token.text)){
                    endFlag = true;
                    return;
                }
    
                if (token.text === SUBJECT_PREFIX_TOKEN_TEXT){
                    subjectFlag = true;
                    return
                }
    
                if (token.text === RESULT_BLOCK_TOKEN_TEXT){
                    subjectFlag = true;
                    studentFlag = false;
                    subjectInfo = new SubjectInfo();
                    return
                }
    
                if(subjectFlag){

                    if (SUBJECT_INFO_REGEX.test(token.text)){
                        let [subjectCode, subjectName] = token.text.split(':').map((ele) => ele.trim())
                        subjectInfo.codes.push(subjectCode);
                        subjectInfo.names.push(subjectName);
                    }
                    
                    else if (subjectInfo.codes.includes(token.text)) subjectInfo.x.push(token.x)
                    
                    else if (token.text === SUBJECT_CREDIT_PREFIX_TOKEN_TEXT){
                        subjectInfo.iter = i + 1;
                        let subjectCreditTokens = this.getNextTokens(data, subjectInfo.codes.length, subjectInfo)
                        subjectCreditTokens.forEach(tok => subjectInfo.credits.push(parseInt(tok.text)))
                        subjectFlag = false;
                        studentFlag = true;
                        ignoreTokenNum = subjectInfo.codes.length;
                    }
                    // console.log(token)
                }
                
                else if(studentFlag){
                    // console.log(subjectInfo)
                    studentInfo.iter = i
    
                    let nameToken = this.getNextTokens(data, 1, studentInfo)[0]
                    studentInfo.name = nameToken.text
    
                    let nextToken = this.getNextTokens(data, 1, studentInfo)[0]
                    if (!this.isNumber(nextToken.text)){
                        studentInfo.name += " " + nextToken.text
                        studentInfo.iter++;
                    }
                    
                    let rollnoToken = this.getNextTokens(data, 1, studentInfo)[0]
                    // console.log(rollnoToken)
                    if (this.isFirstYearRollNo(rollnoToken.text)) studentInfo.firstyearrollno = rollnoToken.text
                    else studentInfo.rollno = rollnoToken.text
    
                    let gradeTokens = this.getNextTokens(data, subjectInfo.credits.length, studentInfo)
                    if (this.areValidGradeTokens(gradeTokens)){
                        gradeTokens.forEach(tok => studentInfo.grades.push(tok.text));
                    }
                    
                    else{
                        let [placeHolderGrades, missingGrades] = this.getPlaceholderGrades(gradeTokens, subjectInfo.x)
                        placeHolderGrades.forEach(grade => studentInfo.grades.push(grade));
                        studentInfo.iter -= missingGrades;
                    }
                    
                    let totalCreditToken = this.getNextTokens(data, 1, studentInfo)[0];
                    // if(!totalCreditToken){
                    //     console.log(data)
                    //     console.log(gradeTokens);
                    // }
                    studentInfo.totalcredits = parseInt(totalCreditToken.text);
                    
                    let sgpaToken = this.getNextTokens(data, 1, studentInfo)[0];
                    studentInfo.sgpa = parseFloat(sgpaToken.text);
    
                    studentInfo.failed = Array(studentInfo.grades.length).fill(false);
    
                    let papersFailedToken = this.getNextTokens(data, 1, studentInfo)[0];
                    do{
                        if (subjectInfo.codes.some(code => papersFailedToken.text.includes(code))){
                            papersFailedToken.text.split(',').forEach((code: string) => {
                                code = code.trim();
                                studentInfo.failed[subjectInfo.codes.findIndex((ele) => ele === code)] = true;
                            });
                        } 
                        else{
                            studentInfo.iter -= 1
                        }
                        papersFailedToken = this.getNextTokens(data, 1, studentInfo)[0];
                    } while(subjectInfo.codes.some(code => papersFailedToken.text.includes(code)))
                    studentInfo.iter -= 1
                                    
                    
                    // console.log(studentInfo);
    
                    this.students.push(this.generateStudent(miscInfo, subjectInfo, studentInfo));
    
                    ignoreTokenNum = studentInfo.iter - i - 1;
                    
                    studentInfo = new StudentInfo();
    
                }
            }
            
            
        });
    }

    getNextTokens(data: Array<PDFToken>, n: number, info:{iter: number}): Array<PDFToken> {
        info.iter += n
        let tokens = data.slice(info.iter - n, info.iter).map(ele =>{
            return {text: ele.text, x: ele.x, y: ele.y}
        });
        // console.log(tokens)
        return tokens
    }

    generateStudent(misc: MiscInfo, subject: SubjectInfo, student: StudentInfo): Student{
        let s: Student = {
            rollno: student.rollno,
            name: student.name, 
            firstyearrollno: student.firstyearrollno,
            currentsem: misc.currentsem,
            batch: '', 
            dept: {
                name: '',
                code: ''
            },
            degree: misc.degree,
            semester: {
                number: misc.currentsem,
                totalcredits: student.totalcredits,
                sgpa: student.sgpa,
                subjects: []
            }
        }

        let validRollNo = s.rollno ? s.rollno: s.firstyearrollno;
        let validRollNoSplit = validRollNo.split("/") ;
        
        s.batch = validRollNoSplit[0]

        // TODO: implement deptCodeToDeptName()
        // if(validRollNo === s.rollno) s.dept = {name: this.deptCodeToDeptName(validRollNoSplit[1]), code: validRollNoSplit[1]};

        for(let i = 0; i < subject.codes.length; i++){
            s.semester.subjects.push({
                name: subject.names[i],
                code: subject.codes[i],
                credits: subject.credits[i],
                grade: student.grades[i],
                failed: student.failed[i]
            });
        }

        return s
    }

    isNumber(text: string):boolean {
        const NUMBER_CHECK_REGEX = /\d+/;
        return NUMBER_CHECK_REGEX.test(text);
    }

    isFirstYearRollNo(rollno: string): boolean{
        let FIRSTYEAR_CODE_REGEX = /[A|B]\d+/;
        return FIRSTYEAR_CODE_REGEX.test(rollno)
    }

    areValidGradeTokens(gradeTokens: Array<PDFToken>): boolean{
        // console.log(gradeTokens);

        return gradeTokens.every(grade => VALID_GRADES.includes(grade.text))
    }

    getPlaceholderGrades(gradeTokens: Array<PDFToken>, subjectInfoX: Array<number>): [Array<string>, number]{
        const PRECISION = 0.001;

        let validGradeTokens = gradeTokens.filter(grade => VALID_GRADES.includes(grade.text))
        
        let missingGrades: number = gradeTokens.length - validGradeTokens.length
        let placeHolderGrades: Array<string> = Array(gradeTokens.length).fill("");

        validGradeTokens.forEach(gradeToken => {
            let gradeInd: number = subjectInfoX.findIndex(x => Math.abs(gradeToken.x - x) <= PRECISION)
            placeHolderGrades[gradeInd] = gradeToken.text 
        })
        
        return [placeHolderGrades, missingGrades];
    }

}