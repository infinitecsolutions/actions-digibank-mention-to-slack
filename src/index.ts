import * as core from "@actions/core";
import * as github from "@actions/github";
import { WebhookPayload } from "@actions/github/lib/interfaces";

const {version} = require('../package.json')

import {
  pickupUsername,
  pickupInfoFromGithubPayload,
  GithubRepositoryImpl
} from "./modules/github";
import { buildSlackPostMessage, SlackRepositoryImpl } from "./modules/slack";

export type AllInputs = {
  slackWebhookUrl: string;
  iconUrl?: string;
  botName?: string;
};

export const convertToSlackUsername = async (
  githubUsernames: string[],
  githubClient: typeof GithubRepositoryImpl
): Promise<string[]> => {
  const mapping = await githubClient.loadNameMappingConfig();

  const slackIds = githubUsernames
    .map(githubUsername => mapping[githubUsername])
    .filter(slackId => slackId !== undefined) as string[];

  return slackIds;
};

export const execPrReviewRequestedMention = async (
  payload: WebhookPayload,
  allInputs: AllInputs,
  githubClient: typeof GithubRepositoryImpl,
  slackClient: typeof SlackRepositoryImpl
) => {
  const requestedGithubUsername = payload.requested_reviewer?.login || "";
  const slackIds = await convertToSlackUsername(
    [requestedGithubUsername],
    githubClient,
  );

  if (slackIds.length === 0) {
    return;
  }

  const title = payload.pull_request?.title;
  const url = payload.pull_request?.html_url;
  const requestedSlackUserId = slackIds[0];
  const requestUsername = payload.sender?.login;

  const message = `<@${requestedSlackUserId}> has been requested to review <${url}|${title}> by ${requestUsername}.`;
  const { slackWebhookUrl, iconUrl, botName } = allInputs;

  await slackClient.postToSlack(slackWebhookUrl, message, { iconUrl, botName });
};

export const execNormalMention = async (
  payload: WebhookPayload,
  allInputs: AllInputs,
  githubClient: typeof GithubRepositoryImpl,
  slackClient: typeof SlackRepositoryImpl
) => {
  const info = pickupInfoFromGithubPayload(payload);

  const githubUsernames = pickupUsername(info.body);
  if (githubUsernames.length === 0) {
    return;
  }

  const slackIds = await convertToSlackUsername(
    githubUsernames,
    githubClient,
  );

  const message = buildSlackPostMessage(
    slackIds,
    info.title,
    info.url,
    info.body,
    info.senderName
  );

  const { slackWebhookUrl, iconUrl, botName } = allInputs;

  await slackClient.postToSlack(slackWebhookUrl, message, { iconUrl, botName });
};

const getAllInputs = (): AllInputs => {
  const slackWebhookUrl = core.getInput("slack-webhook-url", {
    required: true
  });

  if (!slackWebhookUrl) {
    core.setFailed("Error! Need to set `slack-webhook-url`.");
  }

  const iconUrl = core.getInput("icon-url", { required: false });
  const botName = core.getInput("bot-name", { required: false });

  return {
    slackWebhookUrl,
    iconUrl,
    botName
  };
};

const main = async () => {
  console.log(`Running mention-to-slack version ${version}`)

  const { payload } = github.context;

  try {
    const allInputs = getAllInputs();

    if (payload.action === "review_requested") {
      await execPrReviewRequestedMention(
        payload,
        allInputs,
        GithubRepositoryImpl,
        SlackRepositoryImpl
      );
      return;
    }

    await execNormalMention(
      payload,
      allInputs,
      GithubRepositoryImpl,
      SlackRepositoryImpl
    );
  } catch (error) {
    console.error(error)
    core.setFailed(error.message);
  }
};

main();
