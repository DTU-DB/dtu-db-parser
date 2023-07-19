import { Parsers, StudentModels } from '../src/index';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// const TEST_TIMEOUT_MS = 10000;

const NON_PHD_NORMAL_TESTS: Map<string, string> = new Map();
NON_PHD_NORMAL_TESTS.set('First Year B.Tech.'            , 'BTECH_1Y');
NON_PHD_NORMAL_TESTS.set('B.Tech.'                       , 'BTECH');
NON_PHD_NORMAL_TESTS.set('B.Tech. (Continuing Education)', 'BTECH(CE)');
NON_PHD_NORMAL_TESTS.set('M.Tech.'                       , 'MTECH');
NON_PHD_NORMAL_TESTS.set('M.Sc.'                         , 'MSC');
NON_PHD_NORMAL_TESTS.set('B.Des.'                        , 'BDES');
NON_PHD_NORMAL_TESTS.set('M.Des.'                        , 'MDES');
NON_PHD_NORMAL_TESTS.set('B.A.(Hons.) Economics'         , 'BAE');
NON_PHD_NORMAL_TESTS.set('M.A. Economics'                , 'MAE');
NON_PHD_NORMAL_TESTS.set('BBA'                           , 'BBA');
NON_PHD_NORMAL_TESTS.set('MBA'                           , 'MBA');

const EDGE_CASE_TESTS: Map<string, string> = new Map();
EDGE_CASE_TESTS.set('Name in multiple lines'        , 'MULTI_LINE_NAME');
EDGE_CASE_TESTS.set('Subject Name in multiple lines', 'MULTI_LINE_SUBJECT');
EDGE_CASE_TESTS.set('Program Name in multiple lines', 'MULTI_LINE_PROGRAM');
EDGE_CASE_TESTS.set('Empty Page'                    , 'EMPTY_PAGE');
EDGE_CASE_TESTS.set('Empty Grade'                   , 'EMPTY_GRADE');
EDGE_CASE_TESTS.set('Empty Name'                    , 'EMPTY_NAME');
EDGE_CASE_TESTS.set('No SGPA Data Column'           , 'NO_SGPA');
// EDGE_CASE_TESTS.set("Consolidated Result"           , "")

function runParseTest(testName: string, filePath: string){
	const parser = new Parsers.StudentParser(`${__dirname}/pdf/${filePath}.pdf`);
	test(`running "${testName}" test`, async () => {
		await parser.readPDF();
		parser.parsePages();
		const students = parser.getStudents();
		const expectedResult = JSON.parse(await fs.readFile(`${__dirname}/json/${filePath}.json`, 'utf8')) as Array<StudentModels.Student>;
		expect(students).toEqual<Array<StudentModels.Student>>(expectedResult);
	});
	return parser;
}

function runSubjectTest(testName: string, filePath: string, parser: Parsers.StudentParser){
	test(`running "${testName}" test`, async () => {
		const subjects = parser.getSubjects();
		const expectedResult = JSON.parse(await fs.readFile(`${__dirname}/json/${filePath}.json`, 'utf8')) as Array<StudentModels.Subject>;
		expect(subjects).toEqual<Array<StudentModels.Subject>>(expectedResult);
	});
}

describe('testing Parsers.StudentParser', () => {
	const parsers: Map<string, Parsers.StudentParser> = new Map();
	describe('running Non-Ph.D. tests', () => {
		describe('running student tests', () => {
			NON_PHD_NORMAL_TESTS.forEach((fileName, testName) => {
				if (fileName !== ''){
					parsers.set(testName, runParseTest(testName, `non_phd/students/${fileName}`));
				}
			});
		});
		describe('running subject tests', () => {
			NON_PHD_NORMAL_TESTS.forEach((fileName, testName) => {
				if (fileName !== ''){
					runSubjectTest(testName, `non_phd/subjects/${fileName}`, parsers.get(testName)!);
				}
			});
		});
	});

	describe('running edge case tests', () => {
		EDGE_CASE_TESTS.forEach((fileName, testName) => {
			if (fileName !== ''){
				runParseTest(testName, `edge_cases/${fileName}`);
			}
		});
	});
});