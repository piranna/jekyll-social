const {readFile}       = require('fs').promises
const {basename, join} = require('path')

const githubBasic = require('@piranna/github-basic')
const matter      = require('gray-matter')
const {entries}   = require('walk-sync')

const socialTwitter = require('./social/twitter')


const REGEXP = /^(\d{4}-\d{1,2}-\d{1,2})(?:-(.*))?\.\w+$/


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

    const url = new URL(`${html_url}/${datePath}/${title}`)
    url.pathname = url.pathname.replace('//', '/')

    post.mtime = mtime
    post.date = date
    post.relativePath = relativePath
    post.title = title
    post.url = url.href

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
    app_installation_token: auth,
    html_url,
    jekyllPostsDir = '_posts',
    repo,
    rootDir = '.',
    social: {twitter} = {},
    user,
    user_access_token,
    version = 'mister-fantastic-preview'
  }
){
  const client = githubBasic({version, auth})

  // Get the absolute URL (with scheme) to the rendered site
  return Promise.resolve(html_url
    || client.pages(user, repo).then(({html_url}) => html_url))

  // Read files
  .then(function(html_url)
  {
    const files = entries(join(rootDir, jekyllPostsDir), {directories: false})

    return Promise.all(files.map(mapFiles, html_url))
  })

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
  .then(function()
  {
    const client2 = user_access_token
    ? githubBasic({version, auth: user_access_token})
    : client

    return client2.pagesBuild(user, repo)
  })
}
