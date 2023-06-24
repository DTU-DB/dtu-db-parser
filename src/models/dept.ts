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

DEPARTMENT_CODE_TO_NAME.set("CEEC", "Electronics and Communication Engineering (Continuing Education)")
DEPARTMENT_CODE_TO_NAME.set("CEEE", "Electrical Engineering (Continuing Education)")
DEPARTMENT_CODE_TO_NAME.set("CEME", "Mechanical Engineering (Continuing Education)")
DEPARTMENT_CODE_TO_NAME.set("CECE", "Civil Engineering (Continuing Education)")

DEPARTMENT_CODE_TO_NAME.set("PTE" , "Polymer Technology")
DEPARTMENT_CODE_TO_NAME.set("MST" , "Material Science and Technology")
DEPARTMENT_CODE_TO_NAME.set("NST" , "Nano Science and Technology")
DEPARTMENT_CODE_TO_NAME.set("BIO" , "Bioinformatics")
DEPARTMENT_CODE_TO_NAME.set("BME" , "Bio Medical Engineering")
DEPARTMENT_CODE_TO_NAME.set("IBT" , "Industrial Biotechnology")
DEPARTMENT_CODE_TO_NAME.set("GTE" , "Geotechnical Engineering")
DEPARTMENT_CODE_TO_NAME.set("HRE" , "Hydraulics & Water Resources Engineering")
DEPARTMENT_CODE_TO_NAME.set("HFE" , "Hydraulics & Water Resources Engineering")
DEPARTMENT_CODE_TO_NAME.set("STE" , "Structural Engineering")
DEPARTMENT_CODE_TO_NAME.set("GINF", "Geoinformatics")
DEPARTMENT_CODE_TO_NAME.set("GEO", "Geoinformatics")
DEPARTMENT_CODE_TO_NAME.set("CSE" , "Computer Science & Engineering")
DEPARTMENT_CODE_TO_NAME.set("AI"  , "Artificial Intelligence")
DEPARTMENT_CODE_TO_NAME.set("AFI"  , "Artificial Intelligence")
DEPARTMENT_CODE_TO_NAME.set("MOC" , "Microwave & Optical Communication Engineering")
DEPARTMENT_CODE_TO_NAME.set("SPD" , "Signal Processing & Digital Design")
DEPARTMENT_CODE_TO_NAME.set("VLS" , "VLSI Design and Embedded System")
DEPARTMENT_CODE_TO_NAME.set("C&I" , "Control and Instrumentation")
DEPARTMENT_CODE_TO_NAME.set("PSY" , "Power System")
DEPARTMENT_CODE_TO_NAME.set("PES" , "Power Electronics and Systems")
DEPARTMENT_CODE_TO_NAME.set("ENE" , "Environmental Engineering")
DEPARTMENT_CODE_TO_NAME.set("ISY" , "Information Systems")
DEPARTMENT_CODE_TO_NAME.set("PRD" , "Production Engineering")
DEPARTMENT_CODE_TO_NAME.set("PIE" , "Production Engineering")
DEPARTMENT_CODE_TO_NAME.set("THE" , "Thermal Engineering")
DEPARTMENT_CODE_TO_NAME.set("CAAD", "Computer Aided Analysis and Design")
DEPARTMENT_CODE_TO_NAME.set("CDN" , "Computational Design")
DEPARTMENT_CODE_TO_NAME.set("ESM" , "Energy Systems and Management")
DEPARTMENT_CODE_TO_NAME.set("IEM" , "Industrial Engineering and Management")
DEPARTMENT_CODE_TO_NAME.set("SWE" , "Software Engineering")
DEPARTMENT_CODE_TO_NAME.set("DS"  , "Data Science")
DEPARTMENT_CODE_TO_NAME.set("DSC"  , "Data Science")

DEPARTMENT_CODE_TO_NAME.set("MSCCHE", "Master of Science in Chemistry")
DEPARTMENT_CODE_TO_NAME.set("MSCMAT" , "Master of Science in Mathematics")
DEPARTMENT_CODE_TO_NAME.set("MSCPHY" , "Master of Science in Physics")
DEPARTMENT_CODE_TO_NAME.set("MSCBIO" , "Master of Science in BioTechnology")

DEPARTMENT_CODE_TO_NAME.set("BD"    , "Bachelor of Design")
DEPARTMENT_CODE_TO_NAME.set("MDID"  , "Master of Design in Interaction Design")
DEPARTMENT_CODE_TO_NAME.set("MDLA"  , "Master of Design in Lifestyle and Accessory Design") // TODO: find out the actual dept code
DEPARTMENT_CODE_TO_NAME.set("MDPD"  , "Master of Design in Product Design")
DEPARTMENT_CODE_TO_NAME.set("MDTD"  , "Master of Design in Transportation and Service Design")
DEPARTMENT_CODE_TO_NAME.set("MDVC"  , "Master of Design in Visual Communication")

DEPARTMENT_CODE_TO_NAME.set("BAE", "Bachelor of Arts (Honours) in Economics")
DEPARTMENT_CODE_TO_NAME.set("MAE", "Master of Arts in Economics")

DEPARTMENT_CODE_TO_NAME.set("EMBA", "Master of Business Administration (Executive)")
DEPARTMENT_CODE_TO_NAME.set("BMBA", "Master of Business Administration (Business Analytics)")
DEPARTMENT_CODE_TO_NAME.set("FMBA", "Master of Business Administration (Family Business & Entrepreneurship)")
DEPARTMENT_CODE_TO_NAME.set("IMBA", "Master of Business Administration (Innovation, Entrepreneurship & Venture Development)")
DEPARTMENT_CODE_TO_NAME.set("DMBA", "Master of Business Administration")
DEPARTMENT_CODE_TO_NAME.set("UMBA", "Master of Business Administration")
DEPARTMENT_CODE_TO_NAME.set("MBA" , "Master of Business Administration")
DEPARTMENT_CODE_TO_NAME.set("BBA" , "Bachelor of Business Administration")

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