import {
	GraphQLString,
	GraphQLID,
	GraphQLObjectType,
	GraphQLBoolean
} from "graphql";

const userType = new GraphQLObjectType({
	name: "UserType",
	fields: {
		_id: { type: GraphQLID },
		name: { type: GraphQLString },
		email: { type: GraphQLString },
		isVerified: { type: GraphQLBoolean },
		status: { type: GraphQLBoolean },
		createdAt: { type: GraphQLString },
		lastLogin: { type: GraphQLString }
	}
});

export default userType;
