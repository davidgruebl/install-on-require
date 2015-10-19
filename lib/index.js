'use strict'

const _ = require('lodash')
const check = require('./check')

let result1

check({
  folder: './test',
  exclude: ['node_modules', 'dontIncludeMe'],
  type: 'dependencies'
})

.then(function (res) {
  result1 = res

  return check({
    folder: './test/dontIncludeMe',
    exclude: ['node_modules'],
    type: 'devDependencies'
  })
})

.then(function (result2) {
  console.log('dependencies:', _.isEmpty(result1) ? 'no changes' : result1)
  console.log('devDependencies:', _.isEmpty(result2) ? 'no changes' : result2)
})
