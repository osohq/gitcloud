const { mapSchema, getDirective, MapperKind } = require("@graphql-tools/utils");
const { defaultFieldResolver } = require("graphql");

import { argsToArgsConfig } from "graphql/type/definition";
import { Oso } from "oso-cloud";
const oso = new Oso("https://cloud.osohq.com/", process.env["OSO_AUTH"]);

export default function AuthorizeDirective(schema) {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const authDirective = getDirective(schema, fieldConfig, "authorize")?.[0];
      if (authDirective) {
        const { permission, resource } = authDirective;
        const originalResolver = fieldConfig.resolve || defaultFieldResolver;

        fieldConfig.resolve = async function (source, args, context, info) {
          console.log(args.id);

          const resolved = await originalResolver(source, args, context, info);

          let authorized =
            resource === "Job"
              ? await oso.authorize(
                  { type: "User", id: context.username },
                  permission,
                  { type: resource, id: args?.id },
                  [
                    [
                      "has_relation",
                      { type: "Job", id: args.id as string },
                      "repository",
                      { type: "Repository", id: resolved.repoId as string },
                    ],
                    [
                      "has_role",
                      { type: "User", id: resolved.creatorId as string },
                      "creator",
                      { type: "Job", id: args.id as string },
                    ],
                  ]
                )
              : await oso.authorize(
                  { type: "User", id: context.username },
                  permission,
                  { type: resource, id: args?.id }
                );

          console.log(
            `${context.username} ${permission} ${resource}:${args.id} => ${authorized}`
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
