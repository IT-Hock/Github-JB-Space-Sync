import * as Restify from "restify"
import * as Crypto from "crypto"
import * as Request from "request"
import { ErrorHandler } from "./errors"
import { Space, SpaceIssue } from "./space"
import { GitHubWebhookIssuesEvent, GitHubWebhookPayload, toIssueTemplate } from "./github"
import * as fs from "fs"

import * as DotEnv from "dotenv"
import Log, { LogLevel } from "./log"

DotEnv.config()

let space: Space

const WEBHOOK_SECRET = process.env['GITHUB_SECRET'] || ""

const PORT = process.env['PORT'] || 2652
const SPACE_URL = process.env['SPACE_URL'] || ""
const SPACE_PROJECT = process.env['SPACE_PROJECT'] || ""
const SPACE_TOKEN = process.env['SPACE_TOKEN'] || ""
const SPACE_DEFAULT_STATUS = process.env['SPACE_DEFAULT_STATUS'] || ""

const SPACE_ISSUE_TEMPLATE = fs.readFileSync('templates/issue.txt', 'utf8');

const server = Restify.createServer();
new ErrorHandler(server);
server.use(Restify.plugins.bodyParser())

server.post('/', async (req: Restify.Request, res: Restify.Response, next: Restify.Next) => {
    let body: GitHubWebhookPayload = req.body
    let signature = req.header('X-Hub-Signature')
    let event = req.header('X-GitHub-Event')

    if (process.env['NODE_ENV'] === "production") {
        let hmac = Crypto.createHmac("sha1", WEBHOOK_SECRET)
        let calculatedSignature = "sha1=" + hmac.update(JSON.stringify(req.body)).digest("hex");

        if (calculatedSignature !== signature) {
            return res.send(401)
        }
    }

    switch (event) {
        case 'issues':
            await handleIssuesEvent(res, body as GitHubWebhookIssuesEvent)
            return
        default:
            res.send(200)
            return
    }
});

async function handleIssuesEvent(res: Restify.Response, issueEvent: GitHubWebhookIssuesEvent) {
    if (issueEvent === undefined) {
        Log.instance.error("Issue event is undefined")
        res.send(400)
        return
    }

    if (issueEvent.action !== "opened") {
        Log.instance.debug("Ignoring issue event with action: " + issueEvent.action)
        res.send(200)
        return
    }

    let title = issueEvent.issue.title
    let description = toIssueTemplate(SPACE_ISSUE_TEMPLATE, issueEvent)

    let issue = new SpaceIssue(title, description)
    try{
        await space.createIssue(issue)
        res.send(200)
    } catch (e) {
        Log.instance.error("Error creating issue: " + e)
        res.send(500)
    }
}

// Main function
async function main() {
    space = new Space(SPACE_URL, SPACE_PROJECT, SPACE_TOKEN, SPACE_DEFAULT_STATUS)
    await space.init()

    Log.instance.debug("Space issue statuses: " + space.getIssueStatusList().map(
        status => status.name + " (" + status.id + " - " + status.color + ") " + (status.id == SPACE_DEFAULT_STATUS ? "default" : "")
    ).join(","))

    // Start the server
    server.listen(PORT, function () {
        console.log('%s listening at %s', server.name, server.url);
    });
}

if (process.env['LOG_LEVEL']) {
    Log.instance.setLogLevel(parseInt(process.env['LOG_LEVEL']) as LogLevel)
} else if (process.env['NODE_ENV'] === "production") {
    Log.instance.setLogLevel(LogLevel.Info)
} else {
    Log.instance.setLogLevel(LogLevel.Debug)
}

Log.instance.info("Starting server...")

main().catch(err => {
    console.error(err)
    process.exit(1)
})