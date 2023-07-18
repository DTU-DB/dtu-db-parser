const EMPTY_GRADE = '';
const PASSING_GRADES = ['O', 'A+', 'A', 'B+', 'B', 'C', 'P'];
const FAILING_GRADES = ['F', 'DT', 'RW', 'RL', 'AB', 'I', 'UFM'];
const VALID_GRADES = [...PASSING_GRADES, ...FAILING_GRADES, EMPTY_GRADE];

export {
	EMPTY_GRADE,
	PASSING_GRADES,
	FAILING_GRADES,
	VALID_GRADES
};