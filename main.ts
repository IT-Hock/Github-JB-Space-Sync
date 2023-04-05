import * as Restify from "restify"
import * as Crypto from "crypto"
import * as Request from "request"
import {ErrorHandler} from "./errors"

require('dotenv').config()

type GithubWebRepository = {
    id: number
    name: string
    full_name: string
    private: boolean
    git_url: string
    ssh_url: string
}

type GitHubWebhookPayload = {
    ref: string
    repository: GithubWebRepository
}

type GitHubWebhookIssuesEvent = GitHubWebhookPayload & {
    action: string
    issue: {
        number: number
        title: string
        body: string
    }
}

const WEBHOOK_SECRET = process.env['GITHUB_SECRET'] || ""

const SPACE_URL = process.env['SPACE_URL'] || ""
const SPACE_PROJECT = process.env['SPACE_PROJECT'] || ""
const SPACE_TOKEN = process.env['SPACE_TOKEN'] || ""

function createSpaceIssue(title: string, description: string) : Promise<any> {
    // Promise based
    return new Promise((resolve, reject) => {
        Request.post({
            url: SPACE_URL + '/api/http/projects/id:' + SPACE_PROJECT + '/planning/issues',
            headers: {
                'Authorization': 'Bearer ' + SPACE_TOKEN,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "title": title,
                "description": description,
                "status": process.env['SPACE_DEFAULT_STATUS']
            })
        }, (err: any, res: any, body: any) => {
            let jsonBody = JSON.parse(body)
            if (res.statusCode != 200) {
                reject(new Error("Creating issue was unsucessfull: " + JSON.stringify(jsonBody)))
                return
            }

            //console.log(err)
            //console.log(res)
            //console.log(body)
            resolve(jsonBody)
        })
    })
}

// Configure the server
const server = Restify.createServer();
new ErrorHandler(server);
server.use(Restify.plugins.bodyParser())

server.post('/', async (req: Restify.Request, res: Restify.Response, next: Restify.Next) => {
    let body: GitHubWebhookPayload = req.body
    let signature = req.header('X-Hub-Signature')
    let event = req.header('X-GitHub-Event')

    console.log("Got request!")

    if (false) {
        // Verify the signature
        let hmac = Crypto.createHmac("sha1", WEBHOOK_SECRET)
        let calculatedSignature = "sha1=" + hmac.update(JSON.stringify(req.body)).digest("hex");

        if (calculatedSignature !== signature) {
            return res.send(401)
        }
    }

    // Check if the event is a create issue event
    if (event !== "issues") {
        return res.send(200)
    }
    
    let issueEvent = req.body as GitHubWebhookIssuesEvent
    if (issueEvent.action !== "opened") {
        return res.send(200)
    }

    let title = issueEvent.issue.title
    let description = issueEvent.issue.body

    let result = await createSpaceIssue(title, description)
    if (!result.success) {
        return res.send(500)
    }

    res.send(200)
});

server.listen(2652, function () {
    console.log('%s listening at %s', server.name, server.url);
});