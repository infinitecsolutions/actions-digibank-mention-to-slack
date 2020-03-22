import * as core from "@actions/core";
import * as github from "@actions/github";
import { WebhookPayload } from "@actions/github/lib/interfaces";
import * as yaml from "js-yaml";
import axios from "axios";

const pickupUsername = (text: string) => {
  const pattern = /\B@[a-z0-9_-]+/gi;
  return text.match(pattern).map(username => username.replace("@", ""));
};

// const testPickupUsername = () => {
//   const text = "@jpotts18 what is up man? Are you hanging out with @kyle_clegg";
//   const usernames = pickupUsername(text);
//   console.log(usernames);

//   if (
//     usernames.length === 2 &&
//     usernames[0] === "jpotts18" &&
//     usernames[1] === "kyle_clegg"
//   ) {
//     console.log("pass! testPickupUsername");
//   } else {
//     throw new Error(`fail! testPickupUsername: ${usernames}`);
//   }
// };
// testPickupUsername();

const pickupInfoFromGithubPayload = (
  payload: WebhookPayload
): {
  body: string;
  title: string;
  url: string;
} => {
  if (payload.action === "opened" && payload.issue) {
    return {
      body: payload.issue.body,
      title: payload.issue.title,
      url: payload.issue.html_url
    };
  }

  if (payload.action === "opened" && payload.pull_request) {
    return {
      body: payload.pull_request.body,
      title: payload.pull_request.title,
      url: payload.pull_request.html_url
    };
  }

  if (payload.action === "created" && payload.comment) {
    if (payload.issue) {
      return {
        body: payload.comment.body,
        title: payload.issue.title,
        url: payload.comment.html_url
      };
    }

    if (payload.pull_request) {
      return {
        body: payload.comment.body,
        title: payload.pull_request.title,
        url: payload.comment.html_url
      };
    }
  }

  throw new Error(
    `unknown event hook: ${JSON.stringify(payload, undefined, 2)}`
  );
};

const buildSlackPostMessage = (
  slackUsernamesForMention: string[],
  issueTitle: string,
  commentLink: string,
  githubBody: string
) => {
  const mentionBlock = slackUsernamesForMention.map(n => `@${n}`).join(" ");

  return [
    `${mentionBlock} mentioned at <${commentLink}|${issueTitle}>`,
    `> ${githubBody}`
  ].join("\n");
};

const postToSlack = async (webhookUrl: string, message: string) => {
  const slackOption = {
    text: message,
    link_names: 1,
    username: "Github Mention To Slack",
    icon_emoji: ":bell:"
  };

  await axios.post(webhookUrl, JSON.stringify(slackOption), {
    headers: { "Content-Type": "application/json" }
  });
};

// const testPostToSlack = async () => {
//   const message = buildSlackPostMessage(
//     ["abeyuya"],
//     "title of issue here",
//     "https://google.com",
//     "pr comment dummy @abeyuya"
//   );

//   try {
//     await postToSlack(process.env.SLACK_WEBHOOK_URL, message);
//   } catch (e) {
//     console.error(e);
//   }
// };
// testPostToSlack();

const loadNameMappingConfig = async (
  client: github.GitHub,
  configurationPath: string
) => {
  const configurationContent = await fetchContent(client, configurationPath);

  const configObject: { [githugUsername: string]: string } = yaml.safeLoad(
    configurationContent
  );
  return configObject;
};

const fetchContent = async (
  client: github.GitHub,
  repoPath: string
): Promise<string> => {
  const response: any = await client.repos.getContents({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    path: repoPath,
    ref: github.context.sha
  });

  return Buffer.from(response.data.content, response.data.encoding).toString();
};

const convertToSlackUsername = async (githubUsernames: string[]) => {
  const token = core.getInput("repo-token", { required: true });
  const configPath = core.getInput("configuration-path", { required: true });
  const githubClient = new github.GitHub(token);

  const mapping = await loadNameMappingConfig(githubClient, configPath);
  const slackUsernames = githubUsernames.map(githubUsername => {
    // return github username if mapping does not exist.
    return mapping[githubUsername] || githubUsername;
  });

  return slackUsernames;
};

const main = async () => {
  try {
    const info = pickupInfoFromGithubPayload(github.context.payload);

    const githubUsernames = pickupUsername(info.body);
    const slackUsernames = await convertToSlackUsername(githubUsernames);

    const message = buildSlackPostMessage(
      slackUsernames,
      info.title,
      info.url,
      info.body
    );

    const slackWebhookUrl = core.getInput("slack-webhook-url", {
      required: true
    });
    await postToSlack(slackWebhookUrl, message);

    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2);
    console.log(`The event payload: ${payload}`);
  } catch (error) {
    core.setFailed(error.message);
  }
};

main();