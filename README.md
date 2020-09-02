# Convert Github mention to Slack mention

This action sends mention to your slack account when you have been mentioned at github.

## Feature

- Send mention to slack if you have been mentioned
  - issue
  - pull request
- Send notification to slack if you have been requested to review.

## Inputs

| Name | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| slack-webhook-url | Yes | Null | Slack Incomming Webhook URL to notify. |
| bot-name | No | Github Mention To Slack | Display name for this bot on Slack. |
| icon-url | No | Null | Display icon url for this bot on Slack. |
| run-id | No | Null | Used for the link in the error message when an error occurs. |

## Example usage

Create a file named `.github/workflows/mention-to-slack.yml`.
Copy the content of `mention-to-slack.template.yml`.

## Update User Mapping

Send a PR for `user-mapping.json`

```json
{
  "abeyuya": "XXXXXXXXX",
  "other_github_username": "slack_member_id_here"
}
```

Get the user id by right-clicking their name in their profile and selecting "Copy Link".

## Development

### build dist/index.js

```
$ npm run build
```
