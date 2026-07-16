export {
    GROUPS_COLLECTION,
    groupsValidator,
    groupsIndexes,
    type GroupDoc,
    type GroupStatus
} from "./groups.schema";

export {
    PII_QUESTIONS_COLLECTION,
    piiQuestionsValidator,
    piiQuestionsIndexes,
    type PiiQuestionDoc
} from "./piiQuestions.schema";

export {
    INVARIANT_QUESTIONS_COLLECTION,
    invariantQuestionsValidator,
    invariantQuestionsIndexes,
    type InvariantQuestionDoc
} from "./invariantQuestions.schema";

export {
    GAME_SESSIONS_COLLECTION,
    gameSessionsValidator,
    gameSessionsIndexes,
    type GameSessionDoc,
    type GameSessionStatus,
    type AnswerBoard,
    type AnswerField,
    type GameAnswerItem,
    type ScoreSnapshot,
    type SnapshotPiiItem,
    type SnapshotInvariantItem
} from "./gameSessions.schema";

export {
    FEEDBACK_COLLECTION,
    feedbackValidator,
    feedbackIndexes,
    type FeedbackDoc
} from "./feedback.schema";

export {
    ADMIN_USERS_COLLECTION,
    adminUsersValidator,
    adminUsersIndexes,
    type AdminUserDoc,
    type AdminRole
} from "./adminUsers.schema";

export {
    LEADERBOARD_COLLECTION,
    leaderboardValidator,
    leaderboardIndexes,
    type LeaderboardDoc
} from "./leaderboard.schema";

export { STRICT_VALIDATION } from "./options";