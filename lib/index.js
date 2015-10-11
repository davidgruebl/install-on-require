'use strict'

const fs = require('fs')

const _ = require('lodash')
const detective = require('detective')
const walker = require('walker')
const isBuiltinModule = require('is-builtin-module')

new Promise((resolve, reject) => {
  let paths = []
  walker('./test')
    .filterDir(dir => !dir.includes('node_modules'))
    .on('file', file => paths.push(file))
    .on('error', reject)
    .on('end', resolve.bind(null, paths))
})

.then((paths) => _(paths)
  .filter(path => path.endsWith('.js'))
  .map(file => detective(fs.readFileSync(file, 'utf8')))
  .flatten()
  .filter(path => !(path[0] === '.' || isBuiltinModule(path)))
  .map(path => path.split('/')[0])
  .unique()
  .value()
)

.then(console.log)
