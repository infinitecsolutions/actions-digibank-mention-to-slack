# Convert Github mention to Slack mention

This action sends mention to your slack account when you have been mentioned at github.

## Inputs

| Name | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| slack-webhook-url | Yes | Null | Slack Incomming Webhook URL to notify. |
| bot-name | No | Github Mention To Slack | Display name for this bot on Slack. |
| icon-url | No | Null | Display icon url for this bot on Slack. |

## Example usage

.github/workflows/mention-to-slack.yml

```yml
on:
  issues:
    types: [opened]
  issue_comment:
    types: [created]
  pull_request:
    types: [opened, review_requested]
  pull_request_review:
    types: [submitted]
  pull_request_review_comment:
    types: [created]

jobs:
  mention-to-slack:
    runs-on: ubuntu-latest
    steps:
      - name: Run
        uses: abeyuya/actions-mention-to-slack@v3.0.0
        with:
          slack-webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

user-mapping.json

```json
{
  "abeyuya": "XXXXXXXXX",
  "other_github_username": "slack_member_id_here"
}
```

## Development

### build dist/index.js

```
$ npm run build
```
