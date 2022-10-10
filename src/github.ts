/**
 * Copyright (C) 2020-2022, TomTom (http://tomtom.com).
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const core = require("@actions/core");
const fs = require("fs");
const github = require("@actions/github");

const [OWNER, REPO] = (process.env.GITHUB_REPOSITORY || "").split("/");

/**
 * Get Octokit instance
 */
function getOctokit() {
  const github_token = core.getInput("token");
  return github.getOctokit(github_token);
}

/**
 * Returns whether we are running in context of a Pull Request event
 */
export function isPullRequestEvent() {
  return github.context.eventName === "pull_request";
}

/**
 * Identifier of the current Pull Request
 */
export function getPullRequestId() {
  return github.context.issue.number;
}

/**
 * Retrieves a list of commits associated with the specified Pull Request
 * @param pullrequest_id GitHub Pullrequest ID
 * @returns List of commit objects
 */
export async function getCommits(pullrequest_id: string) {
  // Retrieve commits from provided Pull Request
  const { data: commits } = await getOctokit().rest.pulls.listCommits({
    owner: OWNER,
    repo: REPO,
    pull_number: pullrequest_id,
  });

  return commits;
}

/**
 * Retrieves the Pull Request associated with the specified Pull Request ID
 * @param pullrequest_id GitHub Pullrequest ID
 * @returns Pull Request
 */
export async function getPullRequest(pullrequest_id: string) {
  const { data: pr } = await getOctokit().rest.pulls.get({
    owner: OWNER,
    repo: REPO,
    pull_number: pullrequest_id,
  });

  return pr;
}

/**
 * Creates a GitHub release named `tag_name` on the main branch of the provided repo
 * @param tag_name Name of the tag (and release)
 * @param commitish The commitish (ref, sha, ..) the release shall be made from
 */
export async function createRelease(
  tag_name: string,
  commitish: string,
  body: string
) {
  await getOctokit().rest.repos.createRelease({
    owner: OWNER,
    repo: REPO,
    tag_name: tag_name,
    target_commitish: commitish,
    name: tag_name,
    body: body,
    draft: false,
    prerelease: false,
  });
}

/**
 * Creates a lightweight tag named `tag_name` on the provided sha
 * @param tag_name Name of the tag
 * @param sha The SHA1 value of the tag
 */
export async function createTag(tag_name: string, sha: string) {
  await getOctokit().rest.git.createRef({
    owner: OWNER,
    repo: REPO,
    ref: tag_name.startsWith("refs/tags/") ? tag_name : `refs/tags/${tag_name}`,
    sha: sha,
  });
}

/**
 * Downloads the requested configuration file in case it exists.
 * @param path Path towards the Commisery configuration file
 */
export async function getConfig(path: string) {
  try {
    const { data: config_file } = await getOctokit().rest.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: path,
      ref: github.context.ref,
    });

    fs.writeFileSync(
      ".commisery.yml",
      Buffer.from(config_file.content, "base64")
    );
  } catch (error) {
    core.debug(error);
    return;
  }
}

/**
 * Retrieve `pageSize` commits since specified hash in the current repo
 */
export async function getCommitsSince(sha: string, pageSize: number) {
  const { data: commits } = await getOctokit().rest.repos.listCommits({
    owner: OWNER,
    repo: REPO,
    sha: sha,
    per_page: pageSize,
  });

  return commits;
}

/**
 * Retrieve `pageSize` tags in the current repo
 */
export async function getTags(pageSize: number) {
  const { data: tags } = await getOctokit().rest.repos.listTags({
    owner: OWNER,
    repo: REPO,
    per_page: pageSize,
  });

  return tags;
}

/**
 * Retrieve the Pull Requests associated with the specified commit SHA
 */
export async function getAssociatedPullRequests(sha: string) {
  const { data: prs } =
    await getOctokit().rest.repos.listPullRequestsAssociatedWithCommit({
      owner: OWNER,
      repo: REPO,
      commit_sha: sha,
    });

  return prs;
}
