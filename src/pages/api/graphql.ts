import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { getServerSession } from "next-auth";
import { typeDefs } from "@/backend/graphql/typeDefs";
import { resolvers } from "@/backend/graphql/resolvers";
import connectDB from "@/lib/mongodb";
import { authOptions } from "./auth/[...nextauth]";

// Create Apollo Server instance
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// Connect to MongoDB before handling requests
const handler = startServerAndCreateNextHandler(server, {
  context: async (req, res) => {
    // Ensure MongoDB is connected
    await connectDB();

    // Resolve the logged-in user so resolvers can attribute changes
    // (e.g. resident edit history) to whoever made them.
    const session = await getServerSession(req, res, authOptions);
    const sessionUser = session?.user as any;
    const user = sessionUser
      ? {
          id: sessionUser.id,
          name: sessionUser.name,
          username: sessionUser.username,
          role: sessionUser.role,
        }
      : null;

    return { req, res, user };
  },
});

export default handler;
