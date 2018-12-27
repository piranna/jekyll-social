const ellipsis = require('text-ellipsis')
const Twitter  = require('twitter')


function filterPosts({data: {twitter}})
{
  return twitter == null
}


module.exports = async function(posts, options)
{
  const client = new Twitter(options)

  // Filter published posts
  posts = posts.filter(filterPosts)

  // Publish posts sequentially and get tweets IDs
  for(const {content, data, url} of posts)
  {
    const status = ellipsis(`${data.title}\n${url}\n\n${content}`, 280)
    const params = {status, trim_user: true}

    const {id_str} = await client.post('statuses/update', params)

    data.twitter = id_str
  }

  // Return posts with tweets IDs
  return posts
}
