export interface SemesterSubject{
    name: string,
    code: string,
    credits: number,
    grade: string,
    failed: boolean
}

export interface Semester{
    number: number,
    totalcredits: number,
    sgpa: number,
    subjects: Array<SemesterSubject>,
}
