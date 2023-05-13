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

class PageIterator implements Iterator<PDFToken>{
    private page: Array<PDFToken>;
    private i = 0;

    public lastToken: PDFToken = {text: "", coords: {x: 0, y: 0}};

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
        return new Promise<void>((resolve) => {
            this.pages.forEach((page, i) => {
                this.parsePage(page)
            });
            resolve();
        }) 
    }
    
    parsePage(page: Array<PDFToken>){
        // for (let i = 0; i < page.length; ++i){
        //         let token = page[i];
        //         console.log('"%s" \t (%d, %d)', token.text, token.x, token.y)
        // }
            
        const iter = new PageIterator(page);

        const miscInfo = this.getMiscInfo(iter);

        while (!END_OF_PAGE_REGEX.test(iter.lastToken.text)){
            const studentHeadersCoords = this.getStudentHeadersCoords(iter);
            const subjectInfo = this.getSubjectInfo(iter);
            this.addStudents(iter, miscInfo, subjectInfo, studentHeadersCoords);
        }
    }

    addStudents(iter: PageIterator, miscInfo: MiscInfo, subjectInfo: SubjectInfo, studentHeadersCoords: StudentHeadersCoords){
        let token = iter.lastToken;

        while(token.text !== RESULT_BLOCK_START_TOKEN_TEXT){
            if (END_OF_PAGE_REGEX.test(token.text)){
                return;
            }
            
            // Skip Row without Name or skip to next correct row.
            if (!fcomp(token.coords.x, studentHeadersCoords.name.x)){
                token = iter.next().value;
                continue;
            }
            
            const studentInfo = new StudentInfo()
            
            // Name
            while(fcomp(token.coords.x, studentHeadersCoords.name.x)){
                if (studentInfo.name) studentInfo.name += " "
                studentInfo.name += token.text;
                token = iter.next().value;
            }

            // Sr. No.
            token = iter.next().value

            // Roll No.
            const rollno = token.text
            if (this.isFirstYearRollNo(rollno)) studentInfo.firstyearrollno = rollno
            else studentInfo.rollno = rollno
            token = iter.next().value;
            
            // Grades
            studentInfo.grades = Array(subjectInfo.length).fill(EMPTY_GRADE);
            let gradeInd = subjectInfo.headersCoords.subjects.findIndex(loc => fcomp(token.coords.x, loc.x));
            while(gradeInd !== -1){
                studentInfo.grades[gradeInd] = token.text;
                token = iter.next().value;
                gradeInd = subjectInfo.headersCoords.subjects.findIndex(loc => fcomp(token.coords.x, loc.x));
            }
            
            // Total Credits
            studentInfo.totalcredits = parseInt(token.text);
            token = iter.next().value;
            
            // SGPA
            studentInfo.sgpa = parseFloat(token.text);
            token = iter.next().value;
            
            // Papers Failed
            studentInfo.failed = studentInfo.grades.map(grade => FAILING_GRADES.includes(grade));

            this.students.push(this.generateStudent(miscInfo, subjectInfo, studentInfo));
        }

        return;

    }

    getSubjectInfo(iter: PageIterator): SubjectInfo{
        const subjectInfo  = new SubjectInfo()
        
        let token = iter.lastToken;

        if (token.text === SUBJECT_PREFIX_TOKEN_TEXT){
            token = iter.next().value
        }

        while(SUBJECT_INFO_REGEX.test(token.text)){
            let [subjectCode, subjectName] = token.text.split(':').map((ele: string) => ele.trim())
            subjectInfo.codes.push(subjectCode);
            subjectInfo.names.push(subjectName);
            let tokenCoords = token.coords;
            token = iter.next().value;
            while(fcomp(token.coords.x, tokenCoords.x)){
                subjectInfo.names[subjectInfo.names.length - 1] += " " + token.text;
                token = iter.next().value;
            }
        }

        subjectInfo.length = subjectInfo.codes.length;

        while(subjectInfo.headersCoords.subjects.length !== subjectInfo.length){
            subjectInfo.headersCoords.subjects.push(token.coords);
            token = iter.next().value;
        }

        subjectInfo.headersCoords.totalcredits = token.coords;
        token = iter.next().value;

        subjectInfo.headersCoords.sgpa = token.coords;
        token = iter.next().value;

        subjectInfo.headersCoords.failed = token.coords;
        token = iter.next().value;

        while(subjectInfo.credits.length !== subjectInfo.length){
            subjectInfo.credits.push(parseInt(token.text));
            token = iter.next().value;
        }

        return subjectInfo;
    }

    getStudentHeadersCoords(iter: PageIterator): StudentHeadersCoords{
        const studentHeadersCoords: StudentHeadersCoords = {
            name: {x: 0, y: 0},
            rollno: {x: 0, y: 0}
        }
        
        let token = iter.lastToken;

        while(token.text !== SUBJECT_PREFIX_TOKEN_TEXT){
            if (token.text === NAME_HEADER_TOKEN_TEXT){
                studentHeadersCoords.name = token.coords
            }

            if (token.text === ROLLNO_HEADER_TOKEN_TEXT){
                studentHeadersCoords.rollno = token.coords
            }

            token = iter.next().value;
        }
        
        return studentHeadersCoords;
    }

    getMiscInfo(iter: PageIterator){
        let miscInfo: MiscInfo = {
            degree: "",
            currentsem: 0
        }
        
        let token = iter.next().value;
        
        while(token.text !== RESULT_BLOCK_START_TOKEN_TEXT){
            
            if (token.text === PROGRAM_PREFIX_TOKEN_TEXT) miscInfo.degree = iter.next().value.text;
            if (token.text === SEMESTER_PREFIX_TOKEN_TEXT) miscInfo.currentsem = deromanize(iter.next().value.text);

            token = iter.next().value;
        }

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