#!/bin/bash
# Nightly backup: commits quiz.db to GitHub so progress is preserved

set -e

source ~/.env_quiz_backup

REPO_DIR="/home/ec2-user/world-space-week-2026-quiz"
cd "$REPO_DIR"

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

git add data/quiz.db

if git diff --cached --quiet; then
  echo "[$TIMESTAMP] No changes to quiz.db — skipping backup"
  exit 0
fi

git commit -m "backup: quiz database $TIMESTAMP"

git push https://Sufi-S:${GITHUB_TOKEN}@github.com/Sufi-S/world-space-week-2026-quiz.git main

echo "[$TIMESTAMP] Backup pushed successfully"
