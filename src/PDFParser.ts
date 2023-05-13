import { PdfReader } from "pdfreader";
import { Student } from "./interfaces/student";
import { deromanize } from "romans";

type Coords = {
    x: number,
    y: number
};

type PDFSource = string | Buffer;
type PDFToken = {
    text: string,
    coords: Coords
};

const PRECISION = 0.001;

const PROGRAM_PREFIX_TOKEN_TEXT = "Program :";
const SEMESTER_PREFIX_TOKEN_TEXT = "Sem :";

const RESULT_BLOCK_START_TOKEN_TEXT = "Sr.No";

const NAME_HEADER_TOKEN_TEXT = "Name";
const ROLLNO_HEADER_TOKEN_TEXT = "Roll No.";

const SUBJECT_PREFIX_TOKEN_TEXT = "Credits";
const SUBJECT_INFO_REGEX = /:/;
const SUBJECT_CREDIT_PREFIX_TOKEN_TEXT = "Papers Failed";
const END_OF_PAGE_REGEX = /Page\s\d+/;

const EMPTY_GRADE = "";
const PASSING_GRADES = ["O", "A+", "A", "B+", "B", "C", "P"];
const FAILING_GRADES = ["F", "DT", "RW", "RL", "AB", "I", "UFM"];
const VALID_GRADES = [...PASSING_GRADES, ...FAILING_GRADES, EMPTY_GRADE];

type StudentHeadersCoords = {
    name: Coords,
    rollno: Coords
}

type SubjectHeadersCoords = {
    subjects: Array<Coords>,
    totalcredits: Coords,
    sgpa: Coords,
    failed: Coords
}

class SubjectInfo{
    codes: Array<string> = [];
    names: Array<string> = [];
    credits: Array<number> = [];
    headersCoords: SubjectHeadersCoords = {
        subjects: [],
        totalcredits: {x: 0, y: 0},
        sgpa: {x: 0, y: 0},
        failed: {x: 0, y: 0},
    };
    length: number = 0;
};

class StudentInfo{
    name: string = "";
    rollno: string = "";
    firstyearrollno: string = "";
    grades: Array<string> = [];
    totalcredits: number = 0;
    sgpa: number = 0;
    failed: Array<boolean> = []
};

type MiscInfo = {
    degree: string,
    currentsem: number
}

// TODO: give better function name
function fcomp(a: number, b: number): boolean{
    return Math.abs(a - b) <= PRECISION
}

export class PDFParser{
    pageNum: number = 0;
    pdf: PDFSource;
    pages: Array<Array<PDFToken>> = []; 
    pageData: Array<PDFToken> = [];
    students: Array<Student> = [];
    
    constructor(pdf: PDFSource){
        this.pdf = pdf;
    }

    itemCallback(err: Error, item: any, resolve: any, reject: any){
        if (!item){
            this.pages.push(this.pageData)
            this.pageData = [];
            resolve()
            return;
        }

        else if (item.page){
            this.pageNum = item.page;
            if (this.pageData.length){
                this.pages.push(this.pageData)
                this.pageData = [];
            }
        }

        else if (item.text){
            this.pageData.push({text: item.text.trim(), coords: {x: item.x, y: item.y}});
        }

        else if (err) reject(console.error("error:", err));
    } 

    async readPDF(){
        const reader = new PdfReader();
        let parser: (pdf: PDFSource, callback_fn: (err: Error, item: any) => void) => void; 

        if (typeof this.pdf === 'string'){
            parser = reader.parseFileItems.bind(reader)
        }
        else{
            parser = reader.parseBuffer.bind(reader)
        }

        return new Promise<void>((resolve, reject) => {
            parser(this.pdf, (err, item) => {
                this.itemCallback(err, item, resolve, reject);
            });  
        });
    }

    async parsePages(){
        let parse_promise = new Promise<void>((resolve) => {
            this.pages.forEach((page, i) => {
                this.parsePage(page)
            });
            resolve();
        }) 
        return parse_promise;
    }
    
    parsePage(page: Array<PDFToken>){
        // for (let i = 0; i < page.length; ++i){
        //         let token = page[i];
        //         console.log('"%s" \t (%d, %d)', token.text, token.x, token.y)
        // }
            
        let iter = {val: 0}
        let isPageEnd = false;

        const miscInfo = this.getMiscInfo(page, iter);
            
        while (!isPageEnd){
            const studentHeadersLoc = this.getStudentHeadersLoc(page, iter);
            const subjectInfo = this.getSubjectInfo(page, iter);
            this.addStudents(page, miscInfo, subjectInfo, studentHeadersLoc, iter);
            
            if (END_OF_PAGE_REGEX.test(page[iter.val].text)){
                isPageEnd = true;
            }
        }
    }

    addStudents(page: Array<PDFToken>, miscInfo: MiscInfo, subjectInfo: SubjectInfo,  studentHeadersLoc: StudentHeadersLoc, iter: {val: number}){
        let studentInfo = new StudentInfo()

        let i = iter.val;
        let token = page[i];

        while(token.text !== RESULT_BLOCK_START_TOKEN_TEXT){
            
            // Skip Row without Name or skip to next correct row.
            while(!fcomp(token.x, studentHeadersLoc.name.x)){
                token = page[++i];
                
                // Go to next result block or end of page
                if (token.text === RESULT_BLOCK_START_TOKEN_TEXT || END_OF_PAGE_REGEX.test(token.text)){
                    iter.val = i;
                    return;
                }
            }
            
            // Name
            while(fcomp(token.x, studentHeadersLoc.name.x)){
                if (studentInfo.name) studentInfo.name += " "
                studentInfo.name += token.text;
                token = page[++i];
            }

            // Sr. No.
            token = page[++i]

            // Roll No.
            let rollno = token.text
            if (this.isFirstYearRollNo(rollno)) studentInfo.firstyearrollno = rollno
            else studentInfo.rollno = rollno
            token = page[++i];
            
            // Grades
            studentInfo.grades = Array(subjectInfo.length).fill("");
            let gradeInd = subjectInfo.headersLoc.subjects.findIndex(loc => fcomp(token.x, loc.x));
            while(gradeInd !== -1){
                studentInfo.grades[gradeInd] = token.text;
                token = page[++i];
                gradeInd = subjectInfo.headersLoc.subjects.findIndex(loc => fcomp(token.x, loc.x));
            }
            
            // Total Credits
            studentInfo.totalcredits = parseInt(token.text);
            token = page[++i];
            
            // SGPA
            studentInfo.sgpa = parseFloat(token.text);
            token = page[++i];
            
            // Papers Failed
            studentInfo.failed = Array(subjectInfo.length).fill(false);
            while(fcomp(token.x, subjectInfo.headersLoc.failed.x) || subjectInfo.codes.some(code => token.text.includes(code))){
                token.text.split(",").forEach(code => {
                    code = code.trim();
                    studentInfo.failed[subjectInfo.codes.findIndex((ele) => ele === code)] = true;
                })
                token = page[++i];
            }

            this.students.push(this.generateStudent(miscInfo, subjectInfo, studentInfo));

            studentInfo = new StudentInfo();
            
            if (END_OF_PAGE_REGEX.test(token.text)){
                iter.val = i;
                return;
            }
        }

        iter.val = i;
        return;

    }

    getSubjectInfo(page: Array<PDFToken>, iter: {val: number}): SubjectInfo{
        let subjectInfo: SubjectInfo = new SubjectInfo()
        
        let i = iter.val;
        let token = page[i];

        while(SUBJECT_INFO_REGEX.test(token.text)){
            let [subjectCode, subjectName] = token.text.split(':').map((ele) => ele.trim())
            subjectInfo.codes.push(subjectCode);
            subjectInfo.names.push(subjectName);
            let tokenLoc = {x: token.x, y: token.y};
            token = page[++i];
            while(fcomp(token.x, tokenLoc.x)){
                subjectInfo.names[subjectInfo.names.length - 1] += " " + token.text;
                token = page[++i];
            }
        }

        subjectInfo.length = subjectInfo.codes.length;

        for(let j = 0; j < subjectInfo.length; ++j){
            subjectInfo.headersLoc.subjects.push({x: token.x, y: token.y});
            token = page[++i];
        }

        subjectInfo.headersLoc.totalcredits = {x: token.x, y: token.y};
        token = page[++i];

        subjectInfo.headersLoc.sgpa = {x: token.x, y: token.y};
        token = page[++i];

        subjectInfo.headersLoc.failed = {x: token.x, y: token.y};
        token = page[++i];

        for(let j = 0; j < subjectInfo.length; ++j){
            subjectInfo.credits.push(parseInt(token.text));
            token = page[++i];
        }

        iter.val = i;
        return subjectInfo;
        
    }

    getStudentHeadersLoc(page: Array<PDFToken>, iter: {val: number}): StudentHeadersLoc{
        let studentHeadersLoc: StudentHeadersLoc = {
            name: {x: 0, y: 0},
            rollno: {x: 0, y: 0}
        }
        
        let i = iter.val;
        let token = page[i];

        while(token.text !== SUBJECT_PREFIX_TOKEN_TEXT){
            if (token.text === NAME_HEADER_TOKEN_TEXT){
                [studentHeadersLoc.name.x, studentHeadersLoc.name.y] = [token.x, token.y]
            }

            if (token.text === ROLLNO_HEADER_TOKEN_TEXT){
                [studentHeadersLoc.rollno.x, studentHeadersLoc.rollno.y] = [token.x, token.y]
            }

            token = page[++i];
        }
        
        iter.val = i+1;
        return studentHeadersLoc;
    }

    getMiscInfo(page: Array<PDFToken>, iter: {val: number}){
        let miscInfo: MiscInfo = {
            degree: "",
            currentsem: 0
        }
        
        let i = iter.val;
        let token = page[i];

        
        while(token.text !== RESULT_BLOCK_START_TOKEN_TEXT){
            
            if (token.text === PROGRAM_PREFIX_TOKEN_TEXT) miscInfo.degree = page[i+1].text;
            if (token.text === SEMESTER_PREFIX_TOKEN_TEXT) miscInfo.currentsem = deromanize(page[i+1].text);

            token = page[++i];
        }

        iter.val = i;
        return miscInfo;
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

        return s;
    }

    isFirstYearRollNo(rollno: string): boolean{
        const FIRSTYEAR_CODE_REGEX = /[A|B]\d+/;
        return FIRSTYEAR_CODE_REGEX.test(rollno)
    }
}