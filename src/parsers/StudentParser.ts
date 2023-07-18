import { deromanize } from 'romans';
import { PDFParser } from './PDFParser.js';
import { PageIterator } from './PageIterator.js';
import { Student, Subject, EMPTY_GRADE, FAILING_GRADES, departmentCodeToDepartmentName } from '../models/index.js';

import type { PDFToken } from './PDFParser.js';

const PRECISION = 0.001;

const PROGRAM_PREFIX_TOKEN_TEXT = 'Program :';
const SEMESTER_PREFIX_TOKEN_TEXT = 'Sem :';

const RESULT_BLOCK_START_TOKEN_TEXT = 'Sr.No';

const NAME_HEADER_TOKEN_TEXT = 'Name';
const ROLLNO_HEADER_TOKEN_TEXT = 'Roll No.';
const SGPA_HEADER_TOKEN_TEXT = 'SGPA';

const SUBJECT_PREFIX_TOKEN_TEXT = 'Credits';
const SUBJECT_INFO_REGEX = /:/;
const SUBJECT_CREDIT_PREFIX_TOKEN_TEXT = 'Papers Failed';
const END_OF_PAGE_REGEX = /Page\s\d+/;

type StudentHeadersCoords = {
    name: Coords,
    rollno: Coords
}

type SubjectHeadersCoords = {
    subjects: Array<Coords>,
    totalcredits: Coords,
    sgpa?: Coords,
    failed: Coords
}

class SubjectInfo{
	codes: Array<string> = [];
	names: Array<string> = [];
	credits: Array<number> = [];
	headersCoords: SubjectHeadersCoords = {
		subjects: [],
		totalcredits: {x: 0, y: 0},
		sgpa: undefined,
		failed: {x: 0, y: 0},
	};
	length: number = 0;
}

class StudentInfo{
	name: string = '';
	rollno: string = '';
	firstyearrollno: string = '';
	grades: Array<string> = [];
	totalcredits: number = 0;
	sgpa?: number;
	failed: Array<boolean> = [];
}

type MiscInfo = {
    degree: string,
    currentsem: number
}

function isHorizontallyAligned(a: Coords, b: Coords): boolean{
	return Math.abs(a.x - b.x) <= PRECISION;
}

class StudentParser extends PDFParser{
	private students: Array<Student> = [];
	private subjects: Map<string, Subject> = new Map();

	public async parsePages(): Promise<Array<Student>> {
		await super.parsePages();
		return this.students;
	}

	public async getSubjects(): Promise<Array<Subject>> {
		for(const subCode of this.subjects.keys()){
            this.subjects.get(subCode)!.calculateCentralTendencies();
		}
		return [...this.subjects.values()];
	}

	protected parsePage(page: Array<PDFToken>){
		// for (let i = 0; i < page.length; ++i){
		//         let token = page[i];
		//         console.log(`${token.text} \t (${token.coords.x},${token.coords.y})`)
		// }
            
		const iter = new PageIterator(page);

		const miscInfo = this.getMiscInfo(iter);

		while (!END_OF_PAGE_REGEX.test(iter.lastToken.text)){
			const studentHeadersCoords = this.getStudentHeadersCoords(iter);
			const subjectInfo = this.getSubjectInfo(iter);
			this.addStudentsAndSubjects(iter, miscInfo, subjectInfo, studentHeadersCoords);
		}
	}

	private addStudentsAndSubjects(iter: PageIterator, miscInfo: MiscInfo, subjectInfo: SubjectInfo, studentHeadersCoords: StudentHeadersCoords){
		let token = iter.lastToken;

		while(token.text !== RESULT_BLOCK_START_TOKEN_TEXT){
			if (END_OF_PAGE_REGEX.test(token.text)){
				return;
			}
            
			// Skip Row without Name or skip to next correct row.
			if (! isHorizontallyAligned(token.coords, studentHeadersCoords.name)){
				token = iter.next().value;
				continue;
			}
            
			const studentInfo = new StudentInfo();
            
			// Name
			while(isHorizontallyAligned(token.coords, studentHeadersCoords.name)){
				if (studentInfo.name) studentInfo.name += ' ';
				studentInfo.name += token.text;
				token = iter.next().value;
			}

			// Sr. No.
			token = iter.next().value;

			// Roll No.
			const rollno = token.text;
			if (this.isFirstYearRollNo(rollno)) studentInfo.firstyearrollno = rollno;
			else studentInfo.rollno = rollno;
			token = iter.next().value;
            
			// Grades
			studentInfo.grades = Array(subjectInfo.length).fill(EMPTY_GRADE);
			let gradeInd = subjectInfo.headersCoords.subjects.findIndex(coords => isHorizontallyAligned(token.coords, coords));
			while(gradeInd !== -1){
				studentInfo.grades[gradeInd] = token.text;
				token = iter.next().value;
				gradeInd = subjectInfo.headersCoords.subjects.findIndex(coords => isHorizontallyAligned(token.coords, coords));
			}
            
			// Total Credits
			studentInfo.totalcredits = parseInt(token.text);
			token = iter.next().value;
            
			// SGPA
			if(subjectInfo.headersCoords.sgpa !== undefined){
				studentInfo.sgpa = parseFloat(token.text);
				token = iter.next().value;
			}
            
			// Papers Failed
			studentInfo.failed = studentInfo.grades.map(grade => FAILING_GRADES.includes(grade));

			const student = this.generateStudent(miscInfo, subjectInfo, studentInfo);
			this.students.push(student);

			if(subjectInfo.headersCoords.sgpa !== undefined){
				this.updateSubjectsFrequency(student);
			}
		}

		return;

	}

	private getSubjectInfo(iter: PageIterator): SubjectInfo{
		const subjectInfo  = new SubjectInfo();
        
		let token = iter.lastToken;

		if (END_OF_PAGE_REGEX.test(token.text)){
			return subjectInfo;
		}

		if (token.text === SUBJECT_PREFIX_TOKEN_TEXT){
			token = iter.next().value;
		}

		while(SUBJECT_INFO_REGEX.test(token.text)){
			const [subjectCode, subjectName] = token.text.split(':').map((ele: string) => ele.trim());
			subjectInfo.codes.push(subjectCode);
			subjectInfo.names.push(subjectName);
			const subjectTokenCoords = token.coords;
			token = iter.next().value;
			while(isHorizontallyAligned(token.coords, subjectTokenCoords)){
				subjectInfo.names[subjectInfo.names.length - 1] += ' ' + token.text;
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

		if(token.text === SGPA_HEADER_TOKEN_TEXT){
			subjectInfo.headersCoords.sgpa = token.coords;
			token = iter.next().value;
		}

		subjectInfo.headersCoords.failed = token.coords;
		token = iter.next().value;

		while(subjectInfo.credits.length !== subjectInfo.length){
			subjectInfo.credits.push(parseInt(token.text));
			token = iter.next().value;
		}

		return subjectInfo;
	}

	private getStudentHeadersCoords(iter: PageIterator): StudentHeadersCoords{
		const studentHeadersCoords: StudentHeadersCoords = {
			name: {x: 0, y: 0},
			rollno: {x: 0, y: 0}
		};
        
		let token = iter.lastToken;

		if (END_OF_PAGE_REGEX.test(token.text)){
			return studentHeadersCoords;
		}

		while(token.text !== SUBJECT_PREFIX_TOKEN_TEXT){
			if (token.text === NAME_HEADER_TOKEN_TEXT){
				studentHeadersCoords.name = token.coords;
			}

			if (token.text === ROLLNO_HEADER_TOKEN_TEXT){
				studentHeadersCoords.rollno = token.coords;
			}

			token = iter.next().value;
		}
        
		return studentHeadersCoords;
	}

	private getMiscInfo(iter: PageIterator){
		const miscInfo: MiscInfo = {
			degree: '',
			currentsem: 0
		};
        
		let token = iter.next().value as PDFToken;
        
		while(token.text !== RESULT_BLOCK_START_TOKEN_TEXT){
            
			if (token.text === PROGRAM_PREFIX_TOKEN_TEXT){
				token = iter.next().value;
				miscInfo.degree = token.text;
				const degreeTokenCoords = token.coords;
				token = iter.next().value;
				while(isHorizontallyAligned(degreeTokenCoords, token.coords)){
					miscInfo.degree += ` ${token.text}`;
					token = iter.next().value;
				}
			}
            
			if (token.text === SEMESTER_PREFIX_TOKEN_TEXT){
				miscInfo.currentsem = deromanize(iter.next().value.text);
			}

			if (END_OF_PAGE_REGEX.test(token.text)){
				return miscInfo;
			}


			token = iter.next().value;
		}

		return miscInfo;
	}

	private generateStudent(misc: MiscInfo, subject: SubjectInfo, student: StudentInfo): Student{
		const s: Student = {
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
		};

		const validRollNo = s.rollno ? s.rollno: s.firstyearrollno;
		const validRollNoSplit = validRollNo.split('/') ;
        
		s.batch = validRollNoSplit[0];

		if(validRollNo === s.rollno){
			s.dept = {
				name: departmentCodeToDepartmentName(validRollNoSplit[1]), 
				code: validRollNoSplit[1]
			};
		}

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

	private updateSubjectsFrequency(student: Student){
		for(const semSub of student.semester.subjects){
			if(!this.subjects.has(semSub.code)){
				this.subjects.set(
					semSub.code, 
					new Subject(semSub.code, semSub.name, semSub.credits)
				);
			}
            this.subjects.get(semSub.code)!.incrementGrade(semSub.grade);
		}
	}

	private isFirstYearRollNo(rollno: string): boolean{
		const FIRSTYEAR_CODE_REGEX = /[A|B]\d+/;
		return FIRSTYEAR_CODE_REGEX.test(rollno);
	}
}

export {
	StudentParser
};