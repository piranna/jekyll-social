#!/usr/bin/env node

const parsers     = require('dotenv').parse
const unifyConfig = require('unify-config')

const jekyllSocial = require('.')


const aliases =
{
  GITHUB_REPOSITORY(value)
  {
    const [user, repo] = value.split('/')

    return {repo, user}
  },
  GITHUB_TOKEN: 'auth',
  repo: 'baseUrl'
}

jekyllSocial(unifyConfig({aliases, parsers}))
