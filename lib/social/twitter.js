const Twitter = require('twitter')


function filterPosts({data: {twitter}})
{
  return twitter
}


module.exports = async function(posts, options)
{
  const client = new Twitter(options)

  // Filter published posts
  posts = posts.filter(filterPosts)

  // Publish posts sequentially and get tweets IDs
  for(const {content: status, data} of posts)
  {
    const params = {status, trim_user: true}

    const {id_str} = await client.post('statuses/update', params)

    data.twitter = id_str
  }

  // Return posts with tweets IDs
  return posts
}
