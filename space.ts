import axios, {AxiosRequestConfig, AxiosResponse} from 'axios'

export class Space {
    private _url: string
    private _project: string
    private _token: string
    private _defaultStatusId: string
    private _issueStatuses: SpaceIssueStatus[] = []

    constructor(url: string, project: string, token: string, defaultStatusId: string) {
        this._url = url
        this._project = project
        this._token = token
        this._defaultStatusId = defaultStatusId
    }

    async init() {
        this._issueStatuses = await this.getIssueStatuses()
        if (this._issueStatuses.length === 0) {
            throw new Error("No issue statuses found!")
        }

        if (!this._issueStatuses.find(status => status.id === this._defaultStatusId)) {
            throw new Error("Default issue status not found!")
        }
    }

    private _constructRequest(endpoint: string, body: string | null = null): AxiosRequestConfig {
        return {
            url: this._url + '/api/http/projects/id:' + this._project + endpoint,
            method: body ? 'POST' : 'GET',
            headers: {
                'Authorization': 'Bearer ' + this._token,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            data: body
        }
    }

    public async createIssue(issue: SpaceIssue): Promise<any> {
        let request = this._constructRequest('/planning/issues', JSON.stringify({
            "title": issue.title,
            "description": issue.description,
            "status": this._defaultStatusId
        }))

        const response:AxiosResponse = await axios.request(request)
        if (response.status != 200) {
            throw new Error("Creating issue: " + response.statusText)
        }
        return await response.data
    }

    public async getIssue(id: string): Promise<any> {
        let request = this._constructRequest('/planning/issues/id:' + id)
        const response = await axios.request(request)
        if (response.status != 200) {
            throw new Error("Getting issue: " + response.statusText)
        }
        return await response.data
    }

    public async updateIssue(issue: SpaceIssue): Promise<any> {
        let request = this._constructRequest('/planning/issues/id:' + issue.id, JSON.stringify({
            "title": issue.title,
            "description": issue.description,
            "status": process.env['SPACE_DEFAULT_STATUS']
        }))

        const response = await axios.request(request)
        if (response.status != 200) {
            throw new Error("Updating issue: " + response.statusText)
        }
        return await response.data
    }

    private async getIssueStatuses(): Promise<SpaceIssueStatus[]> {
        let request = this._constructRequest('/planning/issues/statuses')
        const response = await axios.request(request)
        if (response.status != 200) {
            throw new Error("Getting issue statuses: " + response.statusText)
        }
        let json = await response.data as any[]
        let statuses: SpaceIssueStatus[] = []
        for (let status of json) {
            statuses.push(new SpaceIssueStatus(status))
        }
        return statuses
    }

    public getIssueStatusList(): SpaceIssueStatus[] {
        return this._issueStatuses
    }
}

export class SpaceIssueStatus {
    private _id: string
    private _name: string
    private _color: string
    private _isResolved: boolean
    private _isArchived: boolean

    constructor(jsonBody: any) {
        this._id = jsonBody.id
        this._isArchived = jsonBody.archived
        this._name = jsonBody.name
        this._color = jsonBody.color
        this._isResolved = jsonBody.resolved
    }

    get id(): string {
        return this._id
    }

    get name(): string {
        return this._name
    }

    get color(): string {
        return this._color
    }

    get isResolved(): boolean {
        return this._isResolved
    }

    get isArchived(): boolean {
        return this._isArchived
    }
}

export class SpaceIssue {
    private _id: string | null = null
    private _title: string
    private _description: string
    private _tags: string[] = []

    constructor(title: string, description: string) {
        this._title = title
        this._description = description
    }

    get id(): string | null {
        return this._id
    }

    get title(): string {
        return this._title
    }

    get description(): string {
        return this._description
    }

    get tags(): string[] {
        return this._tags
    }

    addTag(tag: string) {
        this._tags.push(tag)
    }

    removeTag(tag: string) {
        let index = this._tags.indexOf(tag)
        if (index > -1) {
            this._tags.splice(index, 1)
        }
    }

    toJSONObject(): any {
        return {
            "title": this._title,
            "description": this._description,
            "tags": this._tags
        }
    }
}