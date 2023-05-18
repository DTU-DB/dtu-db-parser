interface Department{
    name: string,
    code: string
}

const DEPARTMENT_CODE_TO_NAME: Map<string, string> = new Map()
DEPARTMENT_CODE_TO_NAME.set("CO", "Computer Engineering")
DEPARTMENT_CODE_TO_NAME.set("SE", "Software Engineering")
DEPARTMENT_CODE_TO_NAME.set("IT", "Information Technology")
DEPARTMENT_CODE_TO_NAME.set("MC", "Mathematics and Computing")
DEPARTMENT_CODE_TO_NAME.set("EC", "Electronics and Communication Engineering")
DEPARTMENT_CODE_TO_NAME.set("EL", "Electrical and Electronics Engineering")
DEPARTMENT_CODE_TO_NAME.set("EE", "Electrical Engineering")
DEPARTMENT_CODE_TO_NAME.set("EP", "Engineering Physics")
DEPARTMENT_CODE_TO_NAME.set("ME", "Mechanical Engineering")
DEPARTMENT_CODE_TO_NAME.set("PE", "Production and Industrial Engineering")
DEPARTMENT_CODE_TO_NAME.set("BT", "Biotechnology")
DEPARTMENT_CODE_TO_NAME.set("CH", "Chemical Engineering")
DEPARTMENT_CODE_TO_NAME.set("PS", "Polymer Science and Technology")
DEPARTMENT_CODE_TO_NAME.set("CE", "Civil Engineering")
DEPARTMENT_CODE_TO_NAME.set("EN", "Environmental Engineering")
DEPARTMENT_CODE_TO_NAME.set("AE", "Automobile Engineering")

const DEPARTMENT_CODES = Array.from(DEPARTMENT_CODE_TO_NAME.keys());
const DEPARTMENT_NAMES = Array.from(DEPARTMENT_CODE_TO_NAME.values())

class DepartmentCodeDoesNotExistError extends Error{
    constructor(code: string){
        super(`"${code}" does not have a defined department name.`);
        this.name = "DepartmentCodeDoesNotExistError";
    }
}

function departmentCodeToDepartmentName(code: string): string{
    if (DEPARTMENT_CODES.includes(code)){
        return DEPARTMENT_CODE_TO_NAME.get(code) as string
    }

    else{
        throw new DepartmentCodeDoesNotExistError(code);
    }
}

export {
    Department,
    departmentCodeToDepartmentName
}