//NOSONAR const type = 'error'
// const orig = console[type]
// console[type] = function logError() {
//   orig.apply(console, [`[${new Date().toISOString().replace("T", " ").replace(/\..+/, "")}]`, ...arguments])
// }
//
// Usage (filter out console.log): LogFilter(['log'])

const LogFilter = (() => (list) => {
    if (list?.length) {
      list.forEach(item => {
        console[item] = () => { }
      })
    }
  })()
