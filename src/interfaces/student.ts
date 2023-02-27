import { Department } from "./dept";
import { Semester } from "./semester";

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