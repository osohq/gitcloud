const { mapSchema, getDirective, MapperKind } = require("@graphql-tools/utils");
const { defaultFieldResolver } = require("graphql");

import { ftruncateSync } from "fs";
import { argsToArgsConfig } from "graphql/type/definition";
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

          let authorized = await oso.authorize(
            { type: "User", id: context.username },
            permission,
            { type: resource, id: args?.[idParam] },
            gatherContextFacts(resource, resolved, args)
          );

          console.log(
            `${context.username} ${permission} ${resource}:${args?.[idParam]} => ${authorized}`
          );
          if (authorized) {
            return resolved;
          } else {
            throw new Error("unauthorized");
          }
        };
      }
      return fieldConfig;
    },
  });
}
