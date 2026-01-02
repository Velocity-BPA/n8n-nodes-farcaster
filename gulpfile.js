/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

const { src, dest, series } = require('gulp');
const path = require('path');

/**
 * Copy node icons to dist folder
 */
function copyIcons() {
	return src(['nodes/**/*.svg', 'nodes/**/*.png'])
		.pipe(dest('dist/nodes/'));
}

/**
 * Copy credential icons to dist folder
 */
function copyCredentialIcons() {
	return src(['credentials/**/*.svg', 'credentials/**/*.png'])
		.pipe(dest('dist/credentials/'));
}

exports['build:icons'] = series(copyIcons, copyCredentialIcons);
exports.default = series(copyIcons, copyCredentialIcons);
