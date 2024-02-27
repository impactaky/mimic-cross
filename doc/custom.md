# How to customize mimic-cross for your environment

## Overview

mimic-cross can add corresponding packages and override built-in implementations
through the `/etc/mimic-cross/custom` directory.\
You can refer to the default implementation
[builtin/recipes.ts](../mimic-cross.deno/apt/builtin/recipes.ts) and
[builtin/supported.json](../mimic-cross.deno/apt/builtin/supported.json)

## supported.json

Describe how to handle the apt package here.\
The default behavior is to search for elf executables referenced by $PATH from
files installed with the specified package name, allowing for fast execution in
the mimic-cross environment.

e.g. The following will cause the `/usr/bin/time` to be automatically detected
and mimicized when installing the `time` package.

```json
{
  "time": {}
}
```

## recipes.ts

If special processing is required, describe the processing here and reference it
from supported.json.

Excerpt from sudo package as an example.

supported.json

```json
{
  "sudo": {
    "recipe": "sudo"
  }
}
```

recipes.ts

```typescript
export function customRecipes(recipes: Map<string, PackageRecipe>) {
  recipes.set("sudo", {
    postInstall: async (_name, _info) => {
      const sudoPath = await $.which("sudo");
      if (sudoPath === undefined) {
        logger.error("Can't find sudo");
        throw new Error("Can't find sudo");
      }
      const sudoPathRef = $.path(sudoPath);
      await mimicDeploy(sudoPathRef);
      const conf = $.path("/etc/sudo.conf");
      const line = `Path plugin_dir ${config.hostRoot}/usr/libexec/sudo/\n`;
      if (await fileHas(conf, line)) return;
      await conf.appendText(line);
    },
  });
}
```

### nameResolver

Describes special processing for package names.\
This is useful when package names are different in TARGETPLATFORM and
BUILDPLATFORM.

### postInstall

If special handling is required to deploy the package, it is described here.

## How to apply your modification

It must be compiled in order to have the settings changed. When
`/mimic-cross/mimic-cross.deno/setup.sh` is executed, it is compiled in the
script. If you want to compile manually, please execute the following command.

```bash
cd /mimic-cross/mimic-cross.deno
/mimic-cross/mimic-cross/bin/mimic-deno task compile
```
