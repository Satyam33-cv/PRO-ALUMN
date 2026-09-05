// backend/src/graphql/resolvers.js
// GraphQL Resolvers backed by Prisma

const prisma = require('../db');

const resolvers = {
  Query: {
    health: () => "PRO-ALUMN GraphQL API Operational [HNSW Vector Ready]",

    me: async (_, __, context) => {
      if (!context.user) return null;
      return prisma.user.findUnique({
        where: { id: context.user.id },
      });
    },

    users: async (_, { role, search, department, batchYear, limit = 50, offset = 0 }) => {
      const where = {
        isActive: true,
        ...(role && { role }),
        ...(department && { department }),
        ...(batchYear && { batchYear }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { currentCompany: { contains: search, mode: 'insensitive' } },
            { jobTitle: { contains: search, mode: 'insensitive' } },
            { skills: { contains: search, mode: 'insensitive' } },
          ],
        }),
      };

      return prisma.user.findMany({
        where,
        take: Math.min(limit, 100),
        skip: offset,
        orderBy: { totalPoints: 'desc' },
      });
    },

    user: async (_, { id }) => {
      return prisma.user.findUnique({
        where: { id },
      });
    },

    directory: async (_, { query, company, limit = 50 }) => {
      const where = {
        isActive: true,
        isVerified: true,
        ...(company && { currentCompany: { contains: company, mode: 'insensitive' } }),
        ...(query && {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { skills: { contains: query, mode: 'insensitive' } },
            { currentCompany: { contains: query, mode: 'insensitive' } },
            { jobTitle: { contains: query, mode: 'insensitive' } },
          ],
        }),
      };

      return prisma.user.findMany({
        where,
        take: Math.min(limit, 100),
        orderBy: { totalPoints: 'desc' },
      });
    },

    jobs: async (_, { status = 'OPEN', search, limit = 20, offset = 0 }) => {
      const where = {
        ...(status && { status }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { company: { contains: search, mode: 'insensitive' } },
            { location: { contains: search, mode: 'insensitive' } },
            { skills: { contains: search, mode: 'insensitive' } },
          ],
        }),
      };

      return prisma.jobPosting.findMany({
        where,
        take: limit,
        skip: offset,
        include: { postedBy: true },
        orderBy: { createdAt: 'desc' },
      });
    },

    job: async (_, { id }) => {
      return prisma.jobPosting.findUnique({
        where: { id },
        include: { postedBy: true },
      });
    },

    referrals: async (_, { status }, context) => {
      if (!context.user) throw new Error("Authentication required");
      
      const where = {
        OR: [
          { requestedById: context.user.id },
          { referredById: context.user.id },
        ],
        ...(status && { status }),
      };

      return prisma.referralRequest.findMany({
        where,
        include: {
          job: { include: { postedBy: true } },
          requestedBy: true,
          referredBy: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    },

    referral: async (_, { id }, context) => {
      if (!context.user) throw new Error("Authentication required");
      return prisma.referralRequest.findUnique({
        where: { id },
        include: {
          job: { include: { postedBy: true } },
          requestedBy: true,
          referredBy: true,
        },
      });
    },

    events: async (_, { upcomingOnly = true }) => {
      const where = upcomingOnly
        ? { date: { gte: new Date() } }
        : {};

      return prisma.event.findMany({
        where,
        include: { createdBy: true },
        orderBy: { date: 'asc' },
        take: 30,
      });
    },

    stories: async (_, { limit = 10 }) => {
      return prisma.successStory.findMany({
        where: { status: 'APPROVED' },
        include: { author: true },
        orderBy: { upvotes: 'desc' },
        take: limit,
      });
    },

    announcements: async (_, { limit = 10 }) => {
      return prisma.announcement.findMany({
        include: { postedBy: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    },
  },

  Mutation: {
    updateProfile: async (_, args, context) => {
      if (!context.user) throw new Error("Authentication required");

      return prisma.user.update({
        where: { id: context.user.id },
        data: {
          ...(args.name && { name: args.name }),
          ...(args.bio !== undefined && { bio: args.bio }),
          ...(args.jobTitle !== undefined && { jobTitle: args.jobTitle }),
          ...(args.currentCompany !== undefined && { currentCompany: args.currentCompany }),
          ...(args.location !== undefined && { location: args.location }),
          ...(args.skills !== undefined && { skills: args.skills }),
          ...(args.linkedinUrl !== undefined && { linkedinUrl: args.linkedinUrl }),
          lastProfileUpdate: new Date(),
        },
      });
    },

    createJob: async (_, args, context) => {
      if (!context.user) throw new Error("Authentication required");

      return prisma.jobPosting.create({
        data: {
          ...args,
          postedById: context.user.id,
        },
        include: { postedBy: true },
      });
    },

    createReferralRequest: async (_, { jobId, referredById, resumeUrl, notes }, context) => {
      if (!context.user) throw new Error("Authentication required");

      return prisma.referralRequest.create({
        data: {
          jobId,
          referredById,
          requestedById: context.user.id,
          resumeUrl,
          notes,
          status: 'PENDING',
        },
        include: {
          job: { include: { postedBy: true } },
          requestedBy: true,
          referredBy: true,
        },
      });
    },

    updateReferralStatus: async (_, { id, status }, context) => {
      if (!context.user) throw new Error("Authentication required");

      return prisma.referralRequest.update({
        where: { id },
        data: { status },
        include: {
          job: { include: { postedBy: true } },
          requestedBy: true,
          referredBy: true,
        },
      });
    },

    rsvpEvent: async (_, { eventId }, context) => {
      if (!context.user) throw new Error("Authentication required");

      const existing = await prisma.eventRSVP.findUnique({
        where: {
          eventId_userId: {
            eventId,
            userId: context.user.id,
          },
        },
      });

      if (existing) {
        await prisma.eventRSVP.delete({
          where: { id: existing.id },
        });
        return false;
      }

      await prisma.eventRSVP.create({
        data: {
          eventId,
          userId: context.user.id,
          status: 'GOING',
        },
      });
      return true;
    },
  },
};

module.exports = resolvers;
