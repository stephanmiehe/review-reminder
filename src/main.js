"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var core = require("@actions/core");
var github = require("@actions/github");
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var octokit, reminderMessage, reviewTurnaroundHours, recurring, pullRequests, _loop_1, _i, pullRequests_1, pr, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    octokit = github.getOctokit(core.getInput("repo-token", { required: true }));
                    reminderMessage = core.getInput("reminder-message", { required: true });
                    reviewTurnaroundHours = parseInt(core.getInput("review-turnaround-hours", { required: true }));
                    recurring = parseInt(core.getInput("recurring"), 0);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 7, , 8]);
                    return [4 /*yield*/, octokit.pulls.list(__assign(__assign({}, github.context.repo), { state: "open", per_page: 100 }))];
                case 2:
                    pullRequests = (_a.sent()).data;
                    _loop_1 = function (pr) {
                        var pullRequestResponse, pullRequest, reviews, requested_reviewers, result, pullRequestCreatedAt, currentTime, reviewByTime, addReminderComment, hasReminderComment;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    core.info("pr title: " + pr.title);
                                    return [4 /*yield*/, octokit.graphql("\n        query($owner: String!, $name: String!, $number: Int!) {\n          repository(owner: $owner, name: $name) {\n            pullRequest(number: $number) {\n              timelineItems(first: 50, itemTypes: [REVIEW_REQUESTED_EVENT]) {\n                nodes {\n                  __typename\n                  ... on ReviewRequestedEvent {\n                    createdAt\n                    requestedReviewer {\n                      ... on User {\n                        login\n                      }\n                    }\n                  }\n                }\n              },\n              reviews(first: 50, states: [APPROVED, CHANGES_REQUESTED, COMMENTED]) {\n                nodes {\n                  __typename\n                  ... on PullRequestReview {\n                    createdAt\n                    author {\n                      login\n                    }\n                  }\n                }\n              },\n              comments(first: 100) {\n                nodes {\n                  body\n                }\n              }\n            }\n          }\n        }\n        ", {
                                            owner: github.context.repo.owner,
                                            name: github.context.repo.repo,
                                            number: pr.number
                                        })];
                                case 1:
                                    pullRequestResponse = _a.sent();
                                    // If no reviews have been requested the PR is out of scope
                                    if (pullRequestResponse.repository.pullRequest.timelineItems.nodes
                                        .length === 0) {
                                        core.info("issue_number: " + pr.number + " skipping as no reviews have been requested");
                                        return [2 /*return*/, "continue"];
                                    }
                                    // If on hold label applied skip the PR.
                                    if (pr.labels.some(function (label) { return label.name === "on hold"; })) {
                                        core.info("issue_number: " + pr.number + " skipping as on hold label has been applied");
                                        return [2 /*return*/, "continue"];
                                    }
                                    return [4 /*yield*/, octokit.pulls.get(__assign(__assign({}, github.context.repo), { pull_number: pr.number }))];
                                case 2:
                                    pullRequest = (_a.sent()).data;
                                    reviews = pullRequestResponse.repository.pullRequest.reviews.nodes.map(function (rr) { return "" + rr.author.login; });
                                    requested_reviewers = pullRequest.requested_reviewers.map(function (rr) { return "" + rr.login; });
                                    result = requested_reviewers.every(function (val) { return reviews.includes(val); });
                                    // If every requested review has been obtained skip the PR.
                                    if (result) {
                                        core.info("issue_number: " + pr.number + " result: " + result + " all pending reviews have been actioned");
                                        return [2 /*return*/, "continue"];
                                    }
                                    pullRequestCreatedAt = pullRequestResponse.repository.pullRequest.timelineItems.nodes[0]
                                        .createdAt;
                                    currentTime = new Date().getTime();
                                    reviewByTime = new Date(pullRequestCreatedAt).getTime() +
                                        1000 * 60 * 60 * reviewTurnaroundHours;
                                    core.info("currentTime: " + currentTime + " reviewByTime: " + reviewByTime);
                                    if (currentTime < reviewByTime) {
                                        core.info("issue_number: " + pr.number + " currentTime: " + currentTime + " reviewByTime: " + reviewByTime + " PR has not breached review SLA");
                                        return [2 /*return*/, "continue"];
                                    }
                                    addReminderComment = requested_reviewers.map(function (rr) { return "@" + rr; }).join(", ") + " \n" + reminderMessage;
                                    hasReminderComment = pullRequestResponse.repository.pullRequest.comments.nodes.filter(function (node) {
                                        return node.body.match(RegExp(reminderMessage)) != null;
                                    }).length > 0;
                                    if (hasReminderComment && recurring == 0) {
                                        core.info("issue_number: " + pr.number + " hasReminderComment: " + hasReminderComment);
                                        return [2 /*return*/, "continue"];
                                    }
                                    return [4 /*yield*/, octokit.issues.createComment(__assign(__assign({}, github.context.repo), { issue_number: pullRequest.number, body: addReminderComment }))];
                                case 3:
                                    _a.sent();
                                    core.info("create comment issue_number: " + pullRequest.number + " body: " + requested_reviewers + " " + addReminderComment);
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, pullRequests_1 = pullRequests;
                    _a.label = 3;
                case 3:
                    if (!(_i < pullRequests_1.length)) return [3 /*break*/, 6];
                    pr = pullRequests_1[_i];
                    return [5 /*yield**/, _loop_1(pr)];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6: return [3 /*break*/, 8];
                case 7:
                    error_1 = _a.sent();
                    core.setFailed(error_1.message);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
run();