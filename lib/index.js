const {readFile}       = require('fs').promises
const {basename, join} = require('path')

const githubBasic = require('github-basic')
const matter      = require('gray-matter')
const {entries}   = require('walk-sync')

const socialTwitter = require('./social/twitter')


const REGEXP = /^(\d+-\d+-\d+)/


function getTime(path)
{
  return new Date(REGEXP.match(basename(path))[1]).getTime()
}

function post2Update(post)
{
  return {
    content: post.stringify(),
    path: join(this.toString(), post.relativePath)
  }
}

/** Sort by filename date. In conflict, sort by modification date
 */
function sortPosts(a, b)
{
  const dateA = getTime(a.relativePath)
  const dateB = getTime(b.relativePath)

  if(dateA === dateB) return a.mtime - b.mtime

  return dateA - dateB
}


module.exports = function(
  {
    auth,
    jekyllPostsDir = '_posts',
    repo,
    rootDir = '.',
    social: {twitter},
    user
  }
){
  // Read files
  const files = entries(join(rootDir, jekyllPostsDir), {directories: false})

  return Promise.all(files.map(function({fullPath, mtime, relativePath})
  {
    return readFile(fullPath, 'utf8')
    .then(matter)
    .then(function(data)
    {
      return {...data, mtime, relativePath}
    })
  }))

  // Sort posts by date and publish them
  .then(function(posts)
  {
    posts.sort(sortPosts)

    return Promise.all([socialTwitter(posts, twitter)])
  })

  // Compose commit and push to Github
  .then(function(posts)
  {
    // Remove duplicated posts published to several social networks
    posts = [...new Set(posts.flat())]

    const commit =
    {
      message: 'Set URLs for social networks published posts',
      updates: posts.map(post2Update, jekyllPostsDir)
    }

    return githubBasic({version: 3, auth}).commit(user, repo, commit)
  })
}
