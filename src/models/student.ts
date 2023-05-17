import { Department } from "./dept.js";
import { Semester } from "./semester.js";

export interface Student{
    rollno: string,
    name: string, 
    firstyearrollno: string,
    // cgpa: number,
    // deptrank: number,
    // unirank: number,
    currentsem: number,
    batch: string, 
    dept: Department,
    degree: string,
    semester: Semester
}