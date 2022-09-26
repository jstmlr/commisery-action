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

import { context, getOctokit } from "@actions/github";
const core = require("@actions/core");
const octokit = getOctokit(core.getInput("token"));
import { SemVer } from "./semver";

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

    let latest_semver: SemVer | null = null;
commits:
    for (const commit of commits) {
      for (const tag of tags) {
        if (commit.sha == tag.commit.sha) {
          console.log(` - ${commit.commit.message}`);
          latest_semver = SemVer.from_string(tag.name)
          if (latest_semver != null) {
            console.log(`ℹ️ Found SemVer tag: "${tag.name}"`);
            break commits;
          } else {
            console.log(`Commit ${commit.sha.slice(1,6)} has non-SemVer tag: "${tag.name}"`);
          }
        }
      }
      console.log(`Commit ${commit.sha.slice(1,6)} is not associated with a tag`)
    }

    if (latest_semver != null) {
      console.log(`Next major: ${latest_semver.next_major().to_string()}`)
      console.log(`Next minor: ${latest_semver.next_minor().to_string()}`)
      console.log(`Next patch: ${latest_semver.next_patch().to_string()}`)
    } else {
      console.log("No SemVer tags found!")
    }
  } catch (ex) {
    core.startGroup("❌ Exception");
    core.setFailed((ex as Error).message);
  }
}

run();
