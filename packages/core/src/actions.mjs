import { callGraphql, createRateLimitAwareExecutor } from "./graphql.mjs";
import { escapeHtml, sanitizeHttpUrl, stripHtml } from "./utils.mjs";

export async function putComment({ endpoint, token, articleId, content }) {
  const data = await callGraphql({
    endpoint,
    token,
    operationName: "PutComment",
    query: `
      mutation PutComment($input: PutCommentInput!) {
        putComment(input: $input) {
          id
          content
        }
      }
    `,
    variables: {
      input: {
        comment: {
          content,
          type: "article",
          articleId
        }
      }
    }
  });
  return data.putComment;
}

export async function putMomentComment({ endpoint, token, momentId, content }) {
  const data = await callGraphql({
    endpoint,
    token,
    operationName: "PutComment",
    query: `
      mutation PutComment($input: PutCommentInput!) {
        putComment(input: $input) {
          id
          content
        }
      }
    `,
    variables: {
      input: {
        comment: {
          content,
          type: "moment",
          momentId
        }
      }
    }
  });
  return data.putComment;
}

export async function putMoment({ endpoint, token, content, tags = [], articles = [] }) {
  const data = await callGraphql({
    endpoint,
    token,
    operationName: "PutMoment",
    query: `
      mutation PutMoment($input: PutMomentInput!) {
        putMoment(input: $input) {
          id
          shortHash
          content
        }
      }
    `,
    variables: {
      input: {
        content,
        ...(tags.length > 0 ? { tags } : {}),
        ...(articles.length > 0 ? { articles } : {})
      }
    }
  });
  return data.putMoment;
}

export async function deleteMoment({ endpoint, token, momentId }) {
  const data = await callGraphql({
    endpoint,
    token,
    operationName: "DeleteMoment",
    query: `
      mutation DeleteMoment($input: DeleteMomentInput!) {
        deleteMoment(input: $input) {
          id
          shortHash
        }
      }
    `,
    variables: {
      input: {
        id: momentId
      }
    }
  });
  return data.deleteMoment;
}

export async function updateUserProfile({
  endpoint,
  token,
  displayName,
  description,
  avatarAssetId,
  profileCoverAssetId
}) {
  const data = await callGraphql({
    endpoint,
    token,
    operationName: "UpdateUserInfo",
    query: `
      mutation UpdateUserInfo($input: UpdateUserInfoInput!) {
        updateUserInfo(input: $input) {
          id
          userName
          displayName
          info {
            description
            profileCover
          }
        }
      }
    `,
    variables: {
      input: {
        displayName,
        description,
        avatar: avatarAssetId,
        profileCover: profileCoverAssetId
      }
    }
  });
  return data.updateUserInfo;
}

export async function putDraft({
  endpoint,
  token,
  draftId = "",
  title,
  summary,
  html,
  tags = [],
  cover = "",
  canComment = true
}) {
  const data = await callGraphql({
    endpoint,
    token,
    operationName: "PutDraft",
    query: `
      mutation PutDraft($input: PutDraftInput!) {
        putDraft(input: $input) {
          id
          title
          summary
        }
      }
    `,
    variables: {
      input: {
        ...(draftId ? { id: draftId } : {}),
        title,
        summary,
        content: html,
        tags,
        ...(cover ? { cover } : {}),
        canComment
      }
    }
  });
  return data.putDraft;
}

export async function publishArticle({ endpoint, token, draftId }) {
  const data = await callGraphql({
    endpoint,
    token,
    operationName: "PublishArticle",
    query: `
      mutation PublishArticle($input: PublishArticleInput!) {
        publishArticle(input: $input) {
          id
        }
      }
    `,
    variables: { input: { id: draftId } }
  });
  return data.publishArticle;
}

export function buildSourceLinkCommentHtml({ articleTitle, articleUrl }) {
  const safeTitle = escapeHtml(articleTitle);
  const safeUrl = escapeHtml(sanitizeHttpUrl(articleUrl));
  return `<p><a target="_blank" rel="noopener noreferrer nofollow" href="${safeUrl}">${safeTitle}</a>&nbsp;</p>`;
}

export async function postMomentWithSourceLink({
  endpoint,
  token,
  content,
  tags = [],
  articleId,
  articleUrl,
  articleTitle,
  replaceMomentId = "",
  retries = 4,
  delayMs = 65000
}) {
  const execute = createRateLimitAwareExecutor({ retries, delayMs });
  const moment = await execute(
    () => putMoment({ endpoint, token, content: stripHtml(content), tags, articles: articleId ? [articleId] : [] }),
    "putMoment"
  );
  const comment = await putMomentComment({
    endpoint,
    token,
    momentId: moment.id,
    content: buildSourceLinkCommentHtml({ articleTitle, articleUrl })
  });
  const deleted = replaceMomentId
    ? await deleteMoment({ endpoint, token, momentId: replaceMomentId })
    : null;
  return {
    moment,
    source_link_comment: comment,
    deleted_replaced_moment: deleted
  };
}
