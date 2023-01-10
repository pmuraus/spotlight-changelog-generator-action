const core = require("@actions/core")
const github = require("@actions/github")
const ticketWithBracketsRegex = /(\[[a-zA-Z][a-zA-Z0-9_]+-[1-9][0-9]*\])/g
const fs = require("fs")
const {extractCommits} = require("./main")

let jiraBaseUrl = core.getInput("jiraBaseUrl")
if (jiraBaseUrl.slice(-1) !== '/') {
  jiraBaseUrl += "/"
}

const isIterable = object =>
  object != null && typeof object[Symbol.iterator] === 'function'

const generateChangelog = (commits) => {
  const fixes = []
  const features = []
  const miscellaneous = []
  let onlyJiraCommits = core.getInput("includeOnlyCommitTitle")
  console.log(onlyJiraCommits)
  if (isIterable(commits)) {
    for (commit of commits) {
      let message = commit.message
      let ticketMatches = message.match(ticketWithBracketsRegex)
      if (ticketMatches) {
        for (match of ticketMatches) {
          message = message.replace(match, `${match}(${jiraBaseUrl}browse/${match.replace("[", "").replace("]", "")})`)
        }
      } else if (onlyJiraCommits) {
        continue
      }
      if (message.indexOf("Merge ") != 0) {
        if (message.toLowerCase().includes("fix:")) {
          if (message.toLowerCase().indexOf("fix") === 0) {
            fixes.push(message.substring(4, message.length))
          } else {
            fixes.push(message)
          }
        } else if (message.toLowerCase().includes("feat:")) {
          if (message.toLowerCase().indexOf("feat") === 0) {
            features.push(message.substring(5, message.length))
          } else {
            features.push(message)
          }
        } else {
          miscellaneous.push(message)
        }
      }
    }
  }


  let content = extractList(features, "### Features", false)
  content += extractList(fixes, "### Bug Fixes", content.length > 0)
  content += extractList(miscellaneous, "### Miscellaneous", content.length > 0)

  let targetFileName = core.getInput("targetFileName")
  if (targetFileName == null || targetFileName === "") {
    targetFileName = "./Changelog.md"
  }
  console.log(content)
  fs.writeFileSync(targetFileName, content)
}

function extractList(list, title, prependLine) {
  if (list.length == 0) {
    return ""
  }
  let content = ""
  list.forEach(it => {
    if (content.indexOf(it) === -1) {
      content += `* ${it}\n`
    }
  })
  return `${prependLine ? "\n" : ""}${title}\n\n${content}`
}

async function run(after, before) {
  let commits = await extractCommits(after, before)
  generateChangelog(commits)
}

run(github.context.payload.after, github.context.payload.before)