#!/usr/bin/env node

const dotenv      = require('dotenv').parse
const unifyConfig = require('unify-config')

const jekyllSocial = require('.')


const config =
{
  aliases: {GITHUB_TOKEN: 'auth'},
  parsers:
  [
    [dotenv, '']
  ]
}

jekyllSocial(unifyConfig(config))
