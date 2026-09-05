import { getApiBaseUrl } from "@/lib/api";
import { getToken } from "@/lib/auth";

/**
 * Returns the GraphQL endpoint URL derived from the REST API base URL.
 * e.g., "http://localhost:4000/api" -> "http://localhost:4000/graphql"
 */
export function getGraphqlUrl(): string {
  const apiUrl = getApiBaseUrl();
  return apiUrl.replace(/\/api$/, "/graphql");
}

export class GraphQLError extends Error {
  errors: Array<{ message: string; locations?: unknown[]; path?: string[] }>;
  status: number;

  constructor(
    message: string,
    status = 200,
    errors: Array<{ message: string; locations?: unknown[]; path?: string[] }> = []
  ) {
    super(message);
    this.name = "GraphQLError";
    this.status = status;
    this.errors = errors;
  }
}

/**
 * Zero-dependency, lightweight GraphQL fetcher using native fetch.
 * Avoids adding ~40KB of Apollo Client bundle bloat to the frontend.
 */
export async function graphqlRequest<T = any>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const token = getToken();

  const response = await fetch(getGraphqlUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await response.json();

  if (json.errors && json.errors.length > 0) {
    const errorMsg = json.errors.map((e: { message: string }) => e.message).join(", ");
    throw new GraphQLError(errorMsg, response.status, json.errors);
  }

  return json.data as T;
}

// =============================================================================
// PRE-BUILT HIGH-VALUE GRAPHQL QUERIES FOR HEAVY / AGGREGATED SCREENS
// =============================================================================

/**
 * 1. Single Round-Trip Dashboard Aggregator
 * Solves waterfall loading: fetches current user, top announcements,
 * upcoming events, and spotlight stories in a single HTTP request.
 */
export const DASHBOARD_AGGREGATE_QUERY = /* GraphQL */ `
  query GetDashboardAggregate {
    me {
      id
      name
      email
      role
      batchYear
      department
      currentCompany
      jobTitle
      avatarUrl
      totalPoints
      isVerified
    }
    announcements(limit: 5) {
      id
      title
      content
      priority
      createdAt
      postedBy {
        id
        name
        avatarUrl
      }
    }
    events(upcomingOnly: true) {
      id
      title
      description
      location
      date
      isVirtual
      capacity
    }
    stories(limit: 3) {
      id
      title
      content
      upvotes
      createdAt
      author {
        id
        name
        currentCompany
        avatarUrl
      }
    }
  }
`;

/**
 * 2. High-Performance Lean Directory Query
 * Avoids over-fetching: requests only card-level visual fields instead
 * of full 30-field user entity records.
 */
export const DIRECTORY_SEARCH_QUERY = /* GraphQL */ `
  query SearchDirectory($query: String, $company: String, $limit: Int) {
    directory(query: $query, company: $company, limit: $limit) {
      id
      name
      role
      batchYear
      department
      currentCompany
      jobTitle
      location
      skills
      totalPoints
      avatarUrl
      linkedinUrl
      isVerified
    }
  }
`;

/**
 * 3. Jobs Board with Embedded Referrer Profiles
 * Retrieves jobs and posting alumni in a single joined response.
 */
export const JOBS_FEED_QUERY = /* GraphQL */ `
  query GetJobsFeed($search: String, $limit: Int, $offset: Int) {
    jobs(status: OPEN, search: $search, limit: $limit, offset: $offset) {
      id
      title
      company
      location
      jobType
      experienceLevel
      description
      requirements
      skills
      salaryMin
      salaryMax
      currency
      referralSlots
      applyLink
      createdAt
      postedBy {
        id
        name
        currentCompany
        jobTitle
        avatarUrl
        linkedinUrl
      }
    }
  }
`;
