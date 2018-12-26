#!/usr/bin/env node

const unifyConfig = require('unify-config')

const jekyllSocial = require('.')


jekyllSocial(unifyConfig({aliases: {GITHUB_TOKEN: 'auth'}}))
