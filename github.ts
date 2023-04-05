export type GithubWebRepository = {
    id: number
    name: string
    full_name: string
    private: boolean
    git_url: string
    ssh_url: string
}

export type GitHubWebhookPayload = {
    ref: string
    repository: GithubWebRepository
}

export type GitHubWebhookIssuesEvent = GitHubWebhookPayload & {
    action: string
    issue: {
        number: number
        title: string
        body: string
        
        url: string
        repository_url: string
        labels_url: string
        comments_url: string
        events_url: string
        html_url: string
        id: number
        node_id: string
        user: {
            login: string
            id: number
            node_id: string
            avatar_url: string
            gravatar_id: string
            url: string
            html_url: string
            followers_url: string
            following_url: string
            gists_url: string
            starred_url: string
            subscriptions_url: string
            organizations_url: string
            repos_url: string
            events_url: string
            received_events_url: string
            type: string
            site_admin: boolean
        }
        labels: {
            id: number
            node_id: string
            url: string
            name: string
            color: string
            default: boolean
            description: string
        }[]

        locked: boolean
        assignee: null
        assignees: []
        milestone: null
        comments: number
        created_at: string
        updated_at: string
        closed_at: null
        author_association: string
        active_lock_reason: null
        reactions: {
            url: string
            total_count: number
            '+1': number
            '-1': number
            laugh: number
            hooray: number
            confused: number
            heart: number
            rocket: number
            eyes: number
        }
        timeline_url: string
        performed_via_github_app: null
        state_reason: null
    }
}

export function toIssueTemplate(template:string, payload: GitHubWebhookIssuesEvent): string {
    return template
    .replace("{{title}}", payload.issue.title)
    .replace("{{body}}", payload.issue.body)
    .replace("{{url}}", payload.issue.html_url)
    .replace("{{author}}", payload.issue.user.login)
    .replace("{{author_url}}", payload.issue.user.html_url)
    .replace("{{created_at}}", payload.issue.created_at)
    .replace("{{updated_at}}", payload.issue.updated_at)
    .replace("{{labels}}", payload.issue.labels.map(l => l.name).join(", "))
    .replace("{{comments}}", payload.issue.comments.toString())
    .replace("{{reactions}}", payload.issue.reactions.total_count.toString())
    .replace("{{repository}}", payload.repository.name)
}