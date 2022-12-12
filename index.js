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
    if (isIterable(commits)) {
        for (commit of commits) {
            let message = commit.message
            let ticketMatches = message.match(ticketWithBracketsRegex)
            if (ticketMatches) {
                for (match of ticketMatches) {
                    message = message.replace(match, `${match}(${jiraBaseUrl}browse/${match.replace("[", "").replace("]", "")})`)
                }
            }
            if (message.indexOf("Merge ") != 0) {
                if (message.toLowerCase().includes("fix:")) {
                    fixes.push(message)
                } else if (message.toLowerCase().includes("feat:")) {
                    features.push(message)
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
        content += `* ${it}\n`
    })
    return `${prependLine ? "\n" : ""}${title}\n\n${content}`
}

async function run(after, before) {
  let commits = await extractCommits(after, before)
  generateChangelog(commits)
}

run("d9931333153e5d6ec58b5aec73e68fdf027a10de", "1cbe54cd9ba78feea3951467928638923c67d2bb")
// run(github.context.payload.after, github.context.payload.before)