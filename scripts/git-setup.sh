#!/bin/bash
set -euo pipefail

git config alias.feature '!f() { git switch -c "feat/$1"; }; f'
git config alias.fix '!f() { git switch -c "fix/$1"; }; f'
git config alias.refactor '!f() { git switch -c "refactor/$1"; }; f'
git config alias.chore '!f() { git switch -c "chore/$1"; }; f'

git config alias.pr '!git push -u origin HEAD && gh pr create --fill'
git config alias.sync '!git switch main && git pull --rebase origin main && git branch --merged main | grep -v "main$" | while read -r branch; do git push origin --delete "$branch" 2>/dev/null; git branch -d "$branch" 2>/dev/null; done && echo "✓ main actualizado, ramas remotas y locales eliminadas"'
git config alias.clean-branches '!git branch --merged main | grep -v "main$" | while read -r branch; do git push origin --delete "$branch" 2>/dev/null; git branch -d "$branch" 2>/dev/null; done'
git config alias.finish '!f() { git switch main && git pull --rebase origin main && git push origin --delete "$1" 2>/dev/null && git branch -d "$1" 2>/dev/null; }; f'

echo "✓ Git aliases configurados:"
echo "  git feature <name>     → feat/<name>"
echo "  git fix <name>         → fix/<name>"
echo "  git refactor <name>    → refactor/<name>"
echo "  git chore <name>       → chore/<name>"
echo "  git pr                 → push + gh pr create"
echo "  git sync               → main + pull + limpia ramas remotas y locales"
echo "  git clean-branches     → borra ramas remotas y locales ya mergeadas"
echo "  git finish <branch>    → main + pull + borra remota y local"
