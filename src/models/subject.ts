import { VALID_GRADES } from "./grade.js";

const GRADE_TO_GPA: Record<string, number> = {
    "O"  : 10,
    "A+" : 9,
    "A"  : 8, 
    "B+" : 7, 
    "B"  : 6,
    "C"  : 5,
    "P"  : 4,
    "F"  : 0,
    "DT" : 0,
    "RW" : 0,
    "RL" : 0,
    "AB" : 0,
    "I"  : 0,
    "UFM": 0,
    ""   : 0,  
}

class Subject{
    public code: string;
    public name: string;
    public credits: number;
    public total   = 0;
    public median = "B+";
    public average = 0;
    public gradesFreq: Record<string, number> = {
        "O"  : 0,
        "A+" : 0,
        "A"  : 0, 
        "B+" : 0, 
        "B"  : 0,
        "C"  : 0,
        "P"  : 0,
        "F"  : 0,
        "DT" : 0,
        "RW" : 0,
        "RL" : 0,
        "AB" : 0,
        "I"  : 0,
        "UFM": 0,
        ""   : 0,
    };

    constructor(code: string, name: string, credits: number){
        this.code = code;
        this.name = name;
        this.credits = credits;
    }

    public incrementGrade(grade: string){
        try{
            this.gradesFreq[grade]++;
            this.total++;
        } catch(error) {
            console.error(`Unknown grade "${grade}"`);
            throw error; 
        }
    }

    public calculateCentralTendencies(){
        let weightedAverage = 0;
        for(const grade of VALID_GRADES){
            weightedAverage += this.gradesFreq[grade] * GRADE_TO_GPA[grade];
        }
        this.average = Math.round((weightedAverage / this.total + 0.001) * 100) / 100;


        const medianPos = Math.round((this.total + 1) / 2);
        let gradeCount = 0;
        for(const grade of VALID_GRADES.reverse()){
            gradeCount += this.gradesFreq[grade];
            if(medianPos <= gradeCount){
                this.median = grade;
                break;
            }
        }
    }
}

export {Subject, GRADE_TO_GPA};