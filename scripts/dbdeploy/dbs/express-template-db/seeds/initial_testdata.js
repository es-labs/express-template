const mkDt = () => (new Date()).toISOString()

new Intl.DateTimeFormat('default', {
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC', hour12: false, formatMatcher: 'basic'
}).format(new Date())


/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  await knex('student_subject').del()
  await knex('subject').del()
  await knex('student').del()
  await knex('award').del()
  await knex('country').del()
  await knex('state').del()

  let countries = require('./icc.json')
  countries = countries.map(country => ({
    ...country, updated: (new Date()).toISOString()
  }))
  await knex('country').insert( countries )
  await knex('state').insert( require('./state.json') )
  await knex('subject').insert( [
    { code: 'EL1', name: 'English', passingGrade: 40 },
    { code: 'EM', name: 'E Math', passingGrade: 41 },
    { code: 'AM', name: 'A Math', passingGrade: 42 },
    { code: 'PHY', name: 'Physics', passingGrade: 43 },
    { code: 'CHEM', name: 'Chemistry', passingGrade: 44 },
  ])
  await knex('student_subject').insert( [ // studentId from insert above...
    { studentId: 1, subjectCode: 'EM', gradeFinal: 'A', gradeDate: '2024-10-01' },
    { studentId: 1, subjectCode: 'AM', gradeFinal: 'B', gradeDate: '2024-10-01' },
    { studentId: 1, subjectCode: 'PHY', gradeFinal: 'D', gradeDate: '2024-10-01' },
    { studentId: 2, subjectCode: 'EM', gradeFinal: 'C', gradeDate: '2024-10-02' },
    { studentId: 2, subjectCode: 'CHEM', gradeFinal: 'B', gradeDate: '2024-10-02' },
  ])
  await knex('award').insert( [ // studentId from insert above...
    { code: 'ac', name: 'Academic' },
    { code: 'sp', name: 'Sports' },
    { code: 'cv', name: 'Civics' },
 ])
  const students = [...new Array(30)].map( (_, idx) => {
    return {
      firstName: 'first',
      lastName: 'last' + idx,
      avatar: '',
      kyc: '',
      awards: '',
      sex: idx % 2 === 0 ? 'M' : 'F',
      age: idx + 15,
      gpa: (idx + 1) % 5,
      birthDate: '1976-04-19',
      birthTime: '0600',
      country: 'SG',
      state: '',
      dateTimeTz: (new Date()).toISOString(), // sqlite stores as integer...
      secret: '1234',
      remarks: '',
      updated_by: 'someone',
      updated_at: (new Date()).toISOString() 
    }
  })
  await knex('student').insert(students)
}
