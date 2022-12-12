const simpleGit = require('simple-git')

async function extractCommits(after, before) {
  if (!after || !before) {
    return []
  }

  let options = {
    from: before,
    to: after
  }
  if (options.from === "0000000000000000000000000000000000000000") {
    return []
  }
  if (options.to === "0000000000000000000000000000000000000000") {
    return []
  }
  try {
    let res = await simpleGit().log(options)
    return res.all
  } catch (e) {
    console.log("error git: ", e)
    return []
  }
}

module.exports = {extractCommits}
