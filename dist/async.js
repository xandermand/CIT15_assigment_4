// Part C - asynchronous code against a real database
import { pool } from './db.js';
import { findStudent, coursesFor, deleteStudent } from './queries.js';
// --- C1. Steps that depend on each other ----------------------------------
/**
 * The title of the first course a student takes, or undefined when the
 * student does not exist or takes nothing.
 *
 * Two steps, the second needing the first. Handle a missing student with
 * try/catch or with a check, and say in a comment which you chose and why.
 */
export async function firstCourseTitle(studentId) {
    const student = await findStudent(studentId);
    if (student === undefined) {
        return undefined;
    }
    const courses = await coursesFor(studentId);
    if (courses.length === 0) {
        return undefined;
    }
    return courses[0].title;
}
// we chose to use check because try catch is more for errors whereas i feel this is something that is expected to come up
// --- C2. Steps that do not depend on each other ---------------------------
/**
 * Three counts: students, courses, departments.
 *
 * Write it twice. overviewSlowly does one query after another; overview
 * starts all three together. The runner times both.
 *
 * Use this query, and note the pg_sleep: each count is made to take about
 * 200 ms on purpose.
 *
 *     SELECT pg_sleep(0.2), count(*)::int AS total FROM student
 *
 * Without it the three counts against a local database finish in about a
 * millisecond each, and starting them together costs more than it saves,
 * because the pool has to open two more connections. Waiting is what makes
 * the difference visible, and on a real server the waiting is real.
 */
export async function overviewSlowly() {
    const Students = await pool.query(`SELECT pg_sleep(0.2), count(*)::int AS total FROM student`);
    const Courses = await pool.query(`SELECT pg_sleep(0.2), count(*)::int AS total FROM course`);
    const Departments = await pool.query(`SELECT pg_sleep(0.2), count(*)::int AS total FROM department`);
    return {
        students: Students.rows[0].total,
        courses: Courses.rows[0].total,
        departments: Departments.rows[0].total
    };
}
export async function overview() {
    const [Students, Courses, Departments] = await Promise.all([
        pool.query(`SELECT pg_sleep(0.2), count(*)::int AS total FROM student`),
        pool.query(`SELECT pg_sleep(0.2), count(*)::int AS total FROM course`),
        pool.query(`SELECT pg_sleep(0.2), count(*)::int AS total FROM department`)
    ]);
    return {
        students: Students.rows[0].total,
        courses: Courses.rows[0].total,
        departments: Departments.rows[0].total
    };
}
// --- C3. The forgotten await ----------------------------------------------
/**
 * Written for you, and wrong.
 *
 * It should delete a student and then report whether they are still there.
 * It reports that they are. Run it, explain in a comment what happens and
 * in which order, then write the corrected version below.
 *
 * There is a second problem, worse than the wrong answer: if the delete
 * fails, who finds out?
 */
export async function removeAndCheckBroken(id) {
    //its missing an await so findstudent can run before deletestudent finishes.
    deleteStudent(id);
    const still = await findStudent(id);
    return still !== undefined;
}
/** The same thing, correct: false when the student is really gone. */
export async function removeAndCheck(id) {
    await deleteStudent(id);
    const still = await findStudent(id);
    return still !== undefined;
}
//# sourceMappingURL=async.js.map