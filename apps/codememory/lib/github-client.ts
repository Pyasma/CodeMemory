import { Octokit } from 'octokit'

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

export function githubClient() {
    return octokit
}

export { githubClient as Githubclient }
