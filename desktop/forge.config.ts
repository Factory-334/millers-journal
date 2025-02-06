import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { MakerDMG } from "@electron-forge/maker-dmg";
import { AutoUnpackNativesPlugin } from "@electron-forge/plugin-auto-unpack-natives";
import { WebpackPlugin } from "@electron-forge/plugin-webpack";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { FuseV1Options, FuseVersion } from "@electron/fuses";

import { mainConfig } from "./webpack.main.config";
import { rendererConfig } from "./webpack.renderer.config";

const config: ForgeConfig = {
	packagerConfig: {
		name: "Miller's Journal",
		asar: true,
		icon: "./src/static/images/icon",
	},
	rebuildConfig: {},
	makers: [
		new MakerSquirrel({
			setupIcon: "./src/static/images/icon.ico",
		}),
		new MakerZIP({}, ["darwin"]),
		new MakerRpm({
			options: {
				icon: "./src/static/images/icon.png",
			},
		}),
		new MakerDeb({
			options: {
				icon: "./src/static/images/icon.png",
			},
		}),
		new MakerDMG({
			icon: "./src/static/images/icon.icns",
			iconSize: 256,
		}),
	],
	plugins: [
		new AutoUnpackNativesPlugin({}),
		new WebpackPlugin({
			mainConfig,
			renderer: {
				config: rendererConfig,
				entryPoints: [
					{
						html: "./src/calendar/index.html",
						js: "./src/calendar/renderer.ts",
						name: "calendar_window",
						preload: {
							js: "./src/calendar/preload.ts",
						},
					},
					{
						html: "./src/editor/index.html",
						js: "./src/editor/renderer.ts",
						name: "editor_window",
						preload: {
							js: "./src/editor/preload.ts",
						},
					},
				],
			},
		}),
		// Fuses are used to enable/disable various Electron functionality
		// at package time, before code signing the application
		new FusesPlugin({
			version: FuseVersion.V1,
			[FuseV1Options.RunAsNode]: false,
			[FuseV1Options.EnableCookieEncryption]: true,
			[FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
			[FuseV1Options.EnableNodeCliInspectArguments]: false,
			[FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
			[FuseV1Options.OnlyLoadAppFromAsar]: true,
		}),
	],
};

export default config;
