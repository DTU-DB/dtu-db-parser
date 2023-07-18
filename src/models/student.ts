import { Department } from './dept.js';
import { Semester } from './semester.js';

interface Student{
    rollno: string,
    name: string, 
    currentsem: number,
    batch: string, 
    dept: Department,
    degree: string,
    semester: Semester
}

function isFirstYearRollno(rollno: string): boolean{
	const FIRSTYEAR_CODE_REGEX = /[A|B]\d+/;
	return FIRSTYEAR_CODE_REGEX.test(rollno);
}

export{Student, isFirstYearRollno};