const { mapSchema, getDirective, MapperKind } = require("@graphql-tools/utils");
const { defaultFieldResolver } = require("graphql");
import {
  ForbiddenError,
} from "apollo-server-core";


import { Oso, Instance } from "oso-cloud";
const oso = new Oso("https://cloud.osohq.com/", process.env["OSO_AUTH"]);

const gatherContextFacts = (
  resource,
  resolved,
  args
): [predicate: string, ...args: Instance[]][] => {
  switch (resource) {
    case "Job":
      return [
        // Link the Job to its parent Repository
        [
          "has_relation",
          { type: "Job", id: args.id as string },
          "repository",
          { type: "Repository", id: resolved.repoId as string },
        ],
        // Link the Job to its creator Use
        [
          "has_role",
          { type: "User", id: resolved.creatorId as string },
          "creator",
          { type: "Job", id: args.id as string },
        ],
      ];
    default:
      return [];
  }
};

export default function AuthorizeDirective(schema) {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const authDirective = getDirective(schema, fieldConfig, "authorize")?.[0];
      if (authDirective) {
        const { permission, resource, idParam } = authDirective;
        const originalResolver = fieldConfig.resolve || defaultFieldResolver;

        fieldConfig.resolve = async function (source, args, context, info) {
          const resolved = await originalResolver(source, args, context, info);
          if (!context.username) {
            throw new ForbiddenError("Not logged in");
          }
          const id = args?.[idParam] || source?.[idParam];
          console.log(
            `${context.username} ${permission} ${resource}:${id}`
          );
          let authorized = await oso.authorize(
            { type: "User", id: context.username },
            permission,
            { type: resource, id },
            gatherContextFacts(resource, resolved, args)
          );

          console.log(
            `${context.username} ${permission} ${resource}:${id} => ${authorized}`
          );
          if (authorized) {
            return resolved;
          } else {
            throw new ForbiddenError("unauthorized");
          }
        };
      }
      return fieldConfig;
    },
  });
}
