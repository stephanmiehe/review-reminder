import * as core from "@actions/core";
import * as github from "@actions/github";

async function run(): Promise<void> {
  const octokit = github.getOctokit(
    core.getInput("repo-token", { required: true })
  );
  const reminderMessage = core.getInput("reminder-message", { required: true });
  const reviewTurnaroundHours = parseInt(
    core.getInput("review-turnaround-hours", { required: true })
  );
  const recurring = parseInt(core.getInput("recurring"), 0);

  try {
    const { data: pullRequests } = await octokit.pulls.list({
      ...github.context.repo,
      state: "open",
    });

    for (const pr of pullRequests) {
      core.info(`pr title: ${pr.title}`);

      const pullRequestResponse = await octokit.graphql<PullRequestResponse>(
        `
        query($owner: String!, $name: String!, $number: Int!) {
          repository(owner: $owner, name: $name) {
            pullRequest(number: $number) {
              timelineItems(first: 50, itemTypes: [REVIEW_REQUESTED_EVENT]) {
                nodes {
                  __typename
                  ... on ReviewRequestedEvent {
                    createdAt
                    requestedReviewer {
                      ... on User {
                        login
                      }
                    }
                  }
                }
              },
              reviews(first: 50, states: [APPROVED, CHANGES_REQUESTED, COMMENTED]) {
                nodes {
                  __typename
                  ... on PullRequestReview {
                    createdAt
                    author {
                      login
                    }
                  }
                }
              },
              comments(first: 100) {
                nodes {
                  body
                }
              }
            }
          }
        }
        `,
        {
          owner: github.context.repo.owner,
          name: github.context.repo.repo,
          number: pr.number,
        }
      );

      // If no reviews have been requested the PR is out of scope
      if (
        pullRequestResponse.repository.pullRequest.timelineItems.nodes
          .length === 0
      ) {
        core.info(
          `issue_number: ${pr.number} skipping as no reviews have been requested`
        );
        continue;
      }

      const { data: pullRequest } = await octokit.pulls.get({
        ...github.context.repo,
        pull_number: pr.number,
      });

      const reviews = pullRequestResponse.repository.pullRequest.reviews.nodes.map((rr) => `${rr.author.login}`);
      const requested_reviewers = pullRequest.requested_reviewers.map((rr) => `${rr.login}`);

      const result = requested_reviewers.every(val => reviews.includes(val));

      // If every requested review has been obtained skip the PR.
      if (result) {
        core.info(
          `issue_number: ${pr.number} result: ${result} all pending reviews have been actioned`
        );
        continue;
      }

      const pullRequestCreatedAt =
        pullRequestResponse.repository.pullRequest.timelineItems.nodes[0]
          .createdAt;

      const currentTime = new Date().getTime();
      const reviewByTime =
        new Date(pullRequestCreatedAt).getTime() +
        1000 * 60 * 60 * reviewTurnaroundHours;

      core.info(`currentTime: ${currentTime} reviewByTime: ${reviewByTime}`);
      if (currentTime < reviewByTime) {
        core.info(
          `issue_number: ${pr.number} currentTime: ${currentTime} reviewByTime: ${reviewByTime} PR has not breached review SLA`
        );
        continue;
      }

      const addReminderComment = `${requested_reviewers.map((rr) => `@${rr}`).join(", ")} \n${reminderMessage}`;
      const hasReminderComment =
        pullRequestResponse.repository.pullRequest.comments.nodes.filter(
          (node) => {
            return node.body.match(RegExp(reminderMessage)) != null;
          }
        ).length > 0;

      if (hasReminderComment && recurring == 0) {
        core.info(`issue_number: ${pr.number} hasReminderComment: ${hasReminderComment}`);
        continue;
      }

      await octokit.issues.createComment({
        ...github.context.repo,
        issue_number: pullRequest.number,
        body: addReminderComment,
      });

      core.info(
        `create comment issue_number: ${pullRequest.number} body: ${requested_reviewers} ${addReminderComment}`
      );
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

interface PullRequestResponse {
  repository: {
    pullRequest: {
      timelineItems: {
        nodes: TimelineNode[];
      };
      reviews: {
        nodes: ReviewNode[];
      };
      comments: {
        nodes: {
          body: string;
        }[];
      };
    };
  };
}

interface TimelineNode {
  __typename: string;
  createdAt: string;
  requestedReviewer: RequestedReviewer;
}

interface ReviewNode {
  __typename: string;
  createdAt: string;
  author: Author;
}

interface RequestedReviewer {
  login: string;
}

interface Author {
  login: string;
}

run();
