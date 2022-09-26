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

const SEMVER_RE = new RegExp(""
    + /^(?<prefix>[A-Za-z-]+)?/  // optional prefix
    + /(?<major>0|[1-9][0-9]+)/
    + /\.(?<minor>0|[1-9][0-9]+)/
    + /\.(?<patch>0|[1-9][0-9]+)/
    + /(?:-(?<prerelease>[-0-9a-zA-Z]+(?:\.[-0-9a-zA-Z]+)*))?/
    + /(?:\+(?<build>[-0-9a-zA-Z]+(?:\.[-0-9a-zA-Z]+)*))?/
    + /\s*$/);


export class SemVer {
  major: number;
  minor: number;
  patch: number;
  prerelease: string;
  build: string;
  prefix: string;

  constructor(major: number, minor: number, patch: number, prerelease: string, build: string, prefix: string) {
    this.major = major;
    this.minor = minor;
    this.patch = patch;
    this.prerelease = prerelease;
    this.build = build;
    this.prefix = prefix;
  }

  public static from_string(version: string) {
    const match = SEMVER_RE.exec(version);
    if (match != null && match.groups != null) {
      return new SemVer(+match.groups.major,
                        +match.groups.minor,
                        +match.groups.patch,
                        match.groups.prerelease,
                        match.groups.build,
                        match.groups.prefix);
    }
    return null;
  }
  
  public next_major() {
    return new SemVer(this.major + 1, 0, 0, "", "", this.prefix);
  }

  public next_minor() {
    return new SemVer(this.major, this.minor + 1, 0, "", "", this.prefix);
  }

  public next_patch() {
    if (this.prerelease != "") {
      return new SemVer(this.major, this.minor, this.patch, "", "", this.prefix);
    }
    return new SemVer(this.major, this.minor, this.patch + 1, "", "", this.prefix);
  }

  public lessThan(rhs: SemVer) {
    if (this.major < rhs.major)
      return true;
    if (this.major == rhs.major) {
      if (this.minor < rhs.minor) {
        return true;
      }
      if (this.minor == rhs.minor) {
        if (this.patch < rhs.patch) {
          return true;
        }
        if (this.patch == rhs.patch) {
          // only prerelease presence is currently evaluated;
          // TODO: commit distance-prerelease is nice to have
          if (this.prerelease == "" && rhs.prerelease != "") {
            return true;
          }
        }
      }
    }
  }

  public equals(rhs: SemVer) {
    return (this.major == rhs.major
      && this.minor == rhs.minor
      && this.patch == rhs.patch
      && !!this.prerelease == !!rhs.prerelease
    );
  }
}
