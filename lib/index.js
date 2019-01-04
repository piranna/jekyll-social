const {readFile}       = require('fs').promises
const {basename, join} = require('path')

const githubBasic = require('github-basic')
const matter      = require('gray-matter')
const {entries}   = require('walk-sync')

const socialTwitter = require('./social/twitter')


const REGEXP = /^(\d{4}-\d{1,2}-\d{1,2})(?:-(.*)?)\.\w+$/


function extractDateTitle(path)
{
  const [, date, title] = REGEXP.exec(basename(path))

  return {date: new Date(date), title}
}

function mapFiles({fullPath, mtime, relativePath})
{
  const html_url = this.toString()

  return readFile(fullPath, 'utf8')
  .then(function(data)
  {
    const post = matter(data)
    const {date, title} = extractDateTitle(relativePath)

    const datePath = date.toISOString().substr(0, 10).replace(/-/g, '/')

    post.mtime = mtime
    post.date = date
    post.relativePath = relativePath
    post.title = title
    post.url = `${html_url}/${datePath}/${title}/`

    return post
  })
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
  const dateA = a.date.getTime()
  const dateB = b.date.getTime()

  if(dateA === dateB) return a.mtime - b.mtime

  return dateA - dateB
}


module.exports = function(
  {
    auth,
    baseUrl,
    jekyllPostsDir = '_posts',
    repo,
    rootDir = '.',
    social: {twitter} = {},
    user,
    version = 'mister-fantastic-preview'
  }
){
  const client = githubBasic({version, auth})

  // Read files
  const files = entries(join(rootDir, jekyllPostsDir), {directories: false})

  return Promise.all(files.map(mapFiles, baseUrl))

  // Sort posts by date and publish them
  .then(function(posts)
  {
    posts.sort(sortPosts)

    return Promise.all([socialTwitter(posts, twitter)])
  })

  // Compose commit and push to Github
  .then(function(posts)
  {
    posts = posts.flat()
    if(!posts.length) return

    // Remove duplicated posts published to several social networks
    posts = [...new Set(posts)]

    const commit =
    {
      message: 'Set URLs for social networks published posts',
      updates: posts.map(post2Update, jekyllPostsDir)
    }

    return client.commit(user, repo, commit)
  })
  .then(client.pagesBuild.bind(client, user, repo))
}
