# Secret Scanning: Gitleaks + pre-commit + GitHub Actions

Personal project to make sure credentials never end up in my public GitHub repositories again.

## Why this exists

In an earlier project I accidentally committed the credentials of a cloud database to a public GitHub repository. I made the repository private afterwards, but a secret that was ever public must be treated as compromised. This project is the follow-up: rotate what was exposed, audit everything I have published, and put automatic checks in place so it cannot happen silently again.

## What was done

1. **Rotated** the exposed database credentials.
2. **Audited the full Git history** of my three public repositories with [Gitleaks](https://github.com/gitleaks/gitleaks) (`gitleaks git`). Result: no leaks found.
3. **Audited the current files** of each repository (`gitleaks dir`). Result: no leaks found.
4. **Enabled GitHub secret scanning and push protection** on the repositories.
5. **Added a local pre-commit hook** that scans staged changes before a commit is created.
6. **Added a GitHub Actions workflow** that scans every push and pull request.

## Defense layers

| Layer | Where it runs | What it does | Weakness |
|---|---|---|---|
| pre-commit hook | My machine | Blocks a commit that contains a secret | Can be skipped with `--no-verify`; must be installed after each clone |
| GitHub Actions | GitHub | Scans every push and pull request | Detects after the push; the secret has already reached the remote |
| Push protection | GitHub | Blocks pushes that contain known secret formats | Limited to formats GitHub recognizes |

No single layer is enough, so they are combined.

## How to reproduce (Windows, PowerShell)

Requirements: Git, Python, and [Gitleaks](https://github.com/gitleaks/gitleaks) installed.

```powershell
python -m pip install pre-commit
python -m pre_commit install
```

`.pre-commit-config.yaml`:

```yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.24.2
    hooks:
      - id: gitleaks
```

`.github/workflows/gitleaks.yml`:

```yaml
name: gitleaks
on:
  push:
  pull_request:
jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Manual audit of a repository:

```powershell
gitleaks git -v .   # full commit history
gitleaks dir -v .   # current files
```

## How it was tested

A fake token with the GitHub personal access token format was written to a file and staged. The commit was blocked by the hook (rule `github-pat`), and the file was removed afterwards. The Actions workflow ran green on the main branch.

An earlier test with a generic string (`api_key = 'EXAMPLE_KEY_12345'`) was **not** detected. Gitleaks relies on patterns, so a clean scan is not proof that no secrets exist.

## Limitations

- Gitleaks detects; it does not rotate or revoke secrets. Anything found must be rotated manually.
- Pattern-based detection can miss secrets with unusual formats and can raise false positives.
- Deleting a secret in a new commit does not remove it from history, and a secret that was public once should be considered compromised.
- Hooks live on each developer machine, so the CI check is the backstop.

## Possible next steps

- Apply the same hook and workflow to my other repositories.
- Add custom rules and an allowlist in `.gitleaks.toml`.
- Add a baseline file for any legacy findings.
- Store secrets in environment variables or a secret manager, never in the repository.
