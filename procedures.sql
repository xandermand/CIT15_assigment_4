-- The routines you write in the database.
--
-- Write them in pgAdmin against the university database, test them there,
-- and then call them from TypeScript. Fill in the parts marked TODO.
--
-- You already have one routine in this database: danish_grade(letter), from
-- Task 5 of the database exercises. Both parts of this assignment use it, so
-- check that it is still there before you start:
--
--     SELECT danish_grade('A'), danish_grade('C-'), danish_grade(NULL);
--
-- If it is gone, the exercises folder has the file you wrote it in.


-- B2. A FUNCTION that queries and returns a result set.
--
-- student_transcript(p_id) returns one row per course the student takes,
-- with the course id, the title, and the grade **already converted** by
-- danish_grade. Order by course id.
--
-- Unlike danish_grade, this one reads tables and needs control flow, so it
-- is written in plpgsql. It must raise an exception when the student does
-- not exist:
--
--     RAISE EXCEPTION 'No student with id %', p_id;
--
-- A trap: CREATE OR REPLACE FUNCTION fails once you change which columns it
-- returns. The message tells you to drop it first:
--
--     DROP FUNCTION student_transcript(varchar);

CREATE OR REPLACE FUNCTION student_transcript(p_id varchar)
RETURNS TABLE (course_id varchar, title varchar, grade varchar)
LANGUAGE plpgsql AS $$
BEGIN
	if not EXISTS(select 1 from student where id = p_id)
  then RAISE EXCEPTION 'No student with id %', p_id;
	end if;
  RETURN QUERY
  SELECT takes.course_id, course.title, danish_grade(takes.grade) AS grade
  FROM takes, course
  WHERE id = p_id and course.course_id = takes.course_id
	ORDER BY takes.course_id;
  RETURN;
END;
$$;

-- Test it:
--     SELECT * FROM student_transcript('00128');   -- two rows, grades 12 and 10
--     SELECT * FROM student_transcript('99999');   -- an error


-- B3. A PROCEDURE that changes several things.
--
-- enrol_student must:
--   look up the credits of the course, and raise an exception when the
--     course does not exist
--   insert a row into takes, with a null grade
--   add the course credits to the student's tot_cred
--   report the student's new total through the INOUT parameter
--
-- A procedure, not a function, because it exists to change things rather
-- than to answer a question.

CREATE OR REPLACE PROCEDURE enrol_student(
  p_id varchar,
  p_course_id varchar,
  p_sec_id varchar,
  p_semester varchar,
  p_year numeric,
  INOUT new_total numeric DEFAULT NULL)
LANGUAGE plpgsql AS $$
DECLARE
  v_credits numeric;
BEGIN
  if not exists(select 1 from course where course_id = p_course_id)
  then raise exception 'No course with id %', p_course_id;
  end if;
  select credits into v_credits from course where course_id = p_course_id;
  insert into takes(id, course_id, sec_id, semester, year, grade)
  values (p_id, p_course_id, p_sec_id, p_semester, p_year, null);
  update student set tot_cred = tot_cred + v_credits where id = p_id;
  returning tot_cred into new_total;
  NULL;
END;
$$;

-- Test it:
--     CALL enrol_student('70557', 'CS-319', '1', 'Spring', 2018);
