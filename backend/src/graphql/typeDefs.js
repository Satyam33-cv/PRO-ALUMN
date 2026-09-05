// backend/src/graphql/typeDefs.js
// GraphQL Schema Definitions

const typeDefs = `#graphql
  enum Role {
    ADMIN
    ALUMNI
    STUDENT
    FACULTY
  }

  enum ReferralStatus {
    PENDING
    ACCEPTED
    REJECTED
    REFERRED
    HIRED
    NOT_HIRED
    WITHDRAWN
  }

  enum JobStatus {
    OPEN
    CLOSED
    EXPIRED
  }

  type User {
    id: ID!
    name: String!
    email: String!
    role: Role!
    batchYear: Int
    department: String
    currentCompany: String
    jobTitle: String
    location: String
    bio: String
    skills: String
    isVerified: Boolean!
    isActive: Boolean!
    totalPoints: Int!
    avatarUrl: String
    linkedinUrl: String
    createdAt: String!
  }

  type JobPosting {
    id: ID!
    title: String!
    company: String!
    location: String!
    jobType: String!
    experienceLevel: String
    description: String!
    requirements: String
    skills: String
    salaryMin: Int
    salaryMax: Int
    currency: String
    applyLink: String
    referralSlots: Int!
    status: JobStatus!
    postedBy: User!
    createdAt: String!
  }

  type ReferralRequest {
    id: ID!
    job: JobPosting!
    requestedBy: User!
    referredBy: User
    status: ReferralStatus!
    resumeUrl: String
    notes: String
    createdAt: String!
  }

  type Event {
    id: ID!
    title: String!
    description: String!
    location: String!
    date: String!
    capacity: Int
    isVirtual: Boolean!
    createdBy: User!
    createdAt: String!
  }

  type SuccessStory {
    id: ID!
    title: String!
    content: String!
    author: User!
    upvotes: Int!
    createdAt: String!
  }

  type Announcement {
    id: ID!
    title: String!
    content: String!
    priority: String
    postedBy: User!
    createdAt: String!
  }

  type Query {
    # System & Health
    health: String!

    # Users / Alumni
    me: User
    users(role: Role, search: String, department: String, batchYear: Int, limit: Int, offset: Int): [User!]!
    user(id: ID!): User

    # Directory Search (Vector & Keyword)
    directory(query: String, company: String, limit: Int): [User!]!

    # Jobs
    jobs(status: JobStatus, search: String, limit: Int, offset: Int): [JobPosting!]!
    job(id: ID!): JobPosting

    # Referrals
    referrals(status: ReferralStatus): [ReferralRequest!]!
    referral(id: ID!): ReferralRequest

    # Community
    events(upcomingOnly: Boolean): [Event!]!
    stories(limit: Int): [SuccessStory!]!
    announcements(limit: Int): [Announcement!]!
  }

  type Mutation {
    # User Profile updates
    updateProfile(
      name: String
      bio: String
      jobTitle: String
      currentCompany: String
      location: String
      skills: String
      linkedinUrl: String
    ): User!

    # Jobs
    createJob(
      title: String!
      company: String!
      location: String!
      jobType: String!
      description: String!
      requirements: String
      skills: String
      salaryMin: Int
      salaryMax: Int
      referralSlots: Int
    ): JobPosting!

    # Referrals
    createReferralRequest(
      jobId: ID!
      referredById: ID!
      resumeUrl: String
      notes: String
    ): ReferralRequest!

    updateReferralStatus(
      id: ID!
      status: ReferralStatus!
    ): ReferralRequest!

    # Events
    rsvpEvent(eventId: ID!): Boolean!
  }
`;

module.exports = typeDefs;
