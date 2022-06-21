const core = require("@actions/core")
const github = require("@actions/github")
const ticketWithBracketsRegex = /(\[[a-zA-Z][a-zA-Z0-9_]+-[1-9][0-9]*\])/g
const fs = require("fs")

const jiraBaseUrl = "https://impactwrap.atlassian.net/"

const generateChangelog = (commits) => {
    const fixes = []
    const features = []
    const miscellaneous = []
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


    let content = extractList(features, "### Features", false)
    content = extractList(features, "### Bug Fixes", content.length > 0)
    content = extractList(features, "### Miscellaneous", content.length > 0)
    
    fs.writeFileSync("./Changelog.md", content)
}

function extractList(list, title, prependLine) {
    if (list.length == 0) {
        return ""
    }
    let content = ""
    list.forEach(it => {
        content += `${it}\n`
    })
    return `${prependLine ? "\n" : ""}${title}\n\n${content}`
}

generateChangelog(require("./testCommits.json"))
