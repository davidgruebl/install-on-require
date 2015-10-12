'use strict'

const fs = require('fs')
const execSync = require('child_process').execSync

const _ = require('lodash')
const detective = require('detective')
const find = require('findit')
const isBuiltinModule = require('is-builtin-module')
const promisify = require('es6-promisify')
const RegClient = require('npm-registry-client')

const client = new RegClient({})
const getPackage = _.bind(promisify(client.get), client, _, {})
const pkg = require('../test/' + 'package.json')
const pkginfo = _.pick(pkg, ['scripts', 'dependencies', 'devDependencies'])

new Promise((resolve, reject) => {
  let paths = []
  find('./test')
    .on('directory', (dir, stat, stop) => {
      if (_.any(['node_modules', 'dontIncludeMe'], block => dir.includes(block))) stop()
    })
    .on('file', file => paths.push(file))
    .on('error', reject)
    .on('end', resolve.bind(null, paths))
})

.then((paths) => Promise.all(_(paths)
  .filter(path => path.endsWith('.js'))
  .map(file => detective(fs.readFileSync(file, 'utf8')))
  .flatten()
  .filter(path => !(path[0] === '.' || isBuiltinModule(path)))
  .filter(pkg => !_([pkginfo.dependencies, pkginfo.devDependencies])
    .map(_.keys)
    .flatten()
    .contains(pkg)
  )
  .map(path => path.split('/')[0])
  .unique()
  .map(name => getPackage('https://registry.npmjs.org/' + name))
  .value())
)

.then((results) => _(results)
  .map(result => result[0])
  .mapKeys(pkg => pkg.name)
  .mapValues(pkg => '^' + pkg['dist-tags'].latest)
  .value()
)

.then(deps => {
  pkg.dependencies = _(pkg.dependencies)
  .assign(deps)
  .pairs()
  .sortBy(0)
  .mapKeys(0)
  .mapValues(1)
  .value()

  fs.writeFileSync(process.cwd() + '/test/' + 'package.json', JSON.stringify(pkg, null, 2))
  execSync('npm install', { cwd: process.cwd() + '/test' })
  return deps
})

.then(console.log)
.catch(console.log)
