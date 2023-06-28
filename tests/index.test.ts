import { Parsers, StudentModels } from "../src/index";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const TEST_TIMEOUT_MS = 10000;

const NON_PHD_NORMAL_TESTS: Map<string, string> = new Map();
NON_PHD_NORMAL_TESTS.set("First Year B.Tech."            , "BTECH_1Y")
NON_PHD_NORMAL_TESTS.set("B.Tech."                       , "BTECH")
NON_PHD_NORMAL_TESTS.set("B.Tech. (Continuing Education)", "BTECH(CE)")
NON_PHD_NORMAL_TESTS.set("M.Tech."                       , "MTECH")
NON_PHD_NORMAL_TESTS.set("M.Sc."                         , "MSC")
NON_PHD_NORMAL_TESTS.set("B.Des."                        , "BDES")
NON_PHD_NORMAL_TESTS.set("M.Des."                        , "MDES")
NON_PHD_NORMAL_TESTS.set("B.A.(Hons.) Economics"         , "BAE")
NON_PHD_NORMAL_TESTS.set("M.A. Economics"                , "MAE")
NON_PHD_NORMAL_TESTS.set("BBA"                           , "BBA")
NON_PHD_NORMAL_TESTS.set("MBA"                           , "MBA")

const EDGE_CASE_TESTS: Map<string, string> = new Map();
EDGE_CASE_TESTS.set("Name in multiple lines"        , "MULTI_LINE_NAME")
EDGE_CASE_TESTS.set("Subject Name in multiple lines", "MULTI_LINE_SUBJECT")
EDGE_CASE_TESTS.set("Program Name in multiple lines", "MULTI_LINE_PROGRAM")
EDGE_CASE_TESTS.set("Empty Page"                    , "EMPTY_PAGE")
EDGE_CASE_TESTS.set("Empty Grade"                   , "EMPTY_GRADE")
EDGE_CASE_TESTS.set("Empty Name"                    , "EMPTY_NAME")
EDGE_CASE_TESTS.set("No SGPA Data Column"           , "NO_SGPA")
// EDGE_CASE_TESTS.set("Consolidated Result"           , "")

function runTest(testName: string, fileName: string){
    test(`running "${testName}" test`, async () => {
        const parser = new Parsers.StudentParser(`${__dirname}/pdf/${fileName}.pdf`);
        await parser.readPDF();
        const result = await parser.parsePages();
        const expectedResult = JSON.parse(await fs.readFile(`${__dirname}/json/${fileName}.json`, 'utf8')) as Array<StudentModels.Student>;
        expect(result).toEqual<Array<StudentModels.Student>>(expectedResult);
    });
}

describe('testing Parsers.StudentParser', () => {
    describe('running Non-Ph.D. tests', () => {
        NON_PHD_NORMAL_TESTS.forEach((fileName, testName) => {
            if (fileName !== ""){
                runTest(testName, fileName);
            }
        });
    });

    describe('running edge case tests', () => {
        EDGE_CASE_TESTS.forEach((fileName, testName) => {
            if (fileName !== ""){
                runTest(testName, fileName);
            }
        });
    });
});