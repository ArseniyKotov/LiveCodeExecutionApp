import * as esbuild from "esbuild-wasm";
import axios from "axios";
import localforage from "localforage";
import { UNPKG_URL } from "./constants";

const fileCache = localforage.createInstance({
  name: "filecache",
});

export const fetchPlugin = (input: string) => {
  return {
    name: "fetch-plugin",
    setup(build: esbuild.PluginBuild) {
      build.onLoad({ filter: /.*/ }, async (args: any) => {
        if (args.path === "index.js") {
          return {
            loader: "jsx",
            contents: input,
          };
        }

        const cachedResult = await fileCache.getItem<esbuild.OnLoadResult>(
          args.path
        );

        if (cachedResult) {
          return cachedResult;
        }

        const { data, request } = await axios.get(args.path);
        const mainFile = request.responseURL.includes(".js")
          ? request.responseURL
          : UNPKG_URL + args.path + "/index.js";

        const result: esbuild.OnLoadResult = {
          loader: "jsx",
          contents: data,
          resolveDir: new URL("./", mainFile).pathname,
        };

        await fileCache.setItem(args.path, result);
        return result;
      });
    },
  };
};
