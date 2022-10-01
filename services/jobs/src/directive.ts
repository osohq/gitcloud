const { mapSchema, getDirective, MapperKind } = require("@graphql-tools/utils");
const { defaultFieldResolver } = require("graphql");

export default function AuthorizeDirective(schema) {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const authDirective = getDirective(schema, fieldConfig, "authorize");
      if (authDirective) {
        const { permission, resource } = authDirective;
        const originalResolver = fieldConfig.resolve || defaultFieldResolver;
        fieldConfig.resolve = async function (source, args, context, info) {
          console.log("foo was here");
          return originalResolver(source, args, context, info);
        };
      }
      return fieldConfig;
    },
  });
}
