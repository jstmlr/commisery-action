/**
 * Copyright (C) 2022, TomTom (http://tomtom.com).
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

import { context, getOctokit } from "@actions/github"
const core = require("@actions/core");
const octokit = getOctokit(core.getInput("token"));

async function run() {
  try {
    const {owner, repo} = context.repo;
    const commits = await octokit.paginate(octokit.rest.repos.listCommits, {
      owner: owner,
      repo: repo,
      sha: context.sha,
    });
    const tags = await octokit.paginate(octokit.rest.repos.listTags, {
      owner: owner,
      repo: repo,
    });
    console.log("ℹ️ Finding latest topological tag..");

    let latest_tag = ""
commits:
    for (const commit of commits) {
      for (const tag of tags) {
        if (commit.sha == tag.commit.sha) {
          console.log(` - ${commit.commit.message}`);
          latest_tag = tag.name;
          break commits;
        }
      }
      console.log(`Commit ${commit.sha} is not associated with a tag`)
    }
  } catch (ex) {
    core.startGroup("❌ Exception");
    core.setFailed((ex as Error).message);
  }
}

run();
