"use strict";
const fileSystem = require("fs");
const express = require("express");
const multer = require("multer");
const execFileSync = require('child_process').execFileSync;
const bodyParser = require("body-parser");
const uploader = multer({ inMemory: true });
const appURL = "/MoarGif";
const loadConfigFileName = function() {
	let result = null;
	const configPrefix = "config=";
	for (let i = 0; i < process.argv.length; i++) {
		var arg = process.argv[i];
		if (arg.startsWith(configPrefix)) {
			return arg.slice(configPrefix.length);
		}
	};
	return result;
};
const configFileName = loadConfigFileName();
const config = JSON.parse(fileSystem.readFileSync(__dirname + "/" + configFileName, 'utf8'));
const app = express();
const portNumber = config.port;
const latinAlphabetLetters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const imageMagickPath = config.imageMagickPath;
const loadLayoutString = function() {
	return fileSystem.readFileSync(__dirname + "/page/layout.html", "utf8");
};
String.prototype.replaceAll =  function(a, b) {
	let text = this;
	while (text.indexOf(a) != -1) {
		text = text.replace(a, b);
	}
	return text;
};
const checkPageNameRestriction = function(pageName) {
	let result = pageName.length > 0;
	if (result) {
		for (let i = 0; i < pageName.length; i++) {
			result = latinAlphabetLetters.indexOf(pageName[i]) > -1;
			if (!result)
				break;
		}
	}
	return result;
};
const loadPageString = function(pageName) {
	let content = null;
	if (checkPageNameRestriction(pageName)) {
		try {
			content = fileSystem.readFileSync(__dirname + "/page/" + pageName + ".html");
		} catch (err) {
			if (err.code = "ENOENT") {
				content = null;
			} else {
				throw err;
			}
		}
	}
	if (content != null)
		content = content.toString();
	return content;
};
const substituteTemplate = function(text) {
	return text.replaceAll("$appURL", appURL);
}
const loadPage = function(pageName) {
	let result = null;
	const layout = substituteTemplate(loadLayoutString());
	let content = loadPageString(pageName);
	if (content != null) {
		content = substituteTemplate(content);
		result = layout.replace("$document", content);
	}
	return result;
};
const processPageRequest = function(request, response) {
	let pageName = request.query.page;
	if (pageName == undefined) {
		pageName = "main";
	}
	const content = loadPage(pageName);
	response.send(content);
};
const processConvertRequest = function(request, response) {
	let options = [];
	if (config.windowsMode)
		options.push('convert');
	if (request.body.colorRadio != 0 && request.body.colorRadio != undefined) {
		options.push('-colors');
		options.push('' + request.body.colorRadio);
	}
	options.push('-type'); options.push('optimize');
	options.push('-resize'); options.push('640x640>');
	options.push('-');
	options.push('GIF:-');
	if (request.file != undefined) {
		var output = execFileSync(imageMagickPath,
			options,
			{
				input: request.file.buffer,
				encoding: "buffer"
			}
		);
		//fileSystem.writeFileSync('temp.gif', output);
		let content = loadPage("delivery");
		content = content.replace("$imageData", output.toString("base64"))
		response.send(content);
	}
};
app.use(bodyParser.urlencoded({extended: true}));
app.get(appURL, processPageRequest);
app.post(appURL + "/convertImage", uploader.single("file"), processConvertRequest);
app.use(appURL + "/third", express.static(__dirname + "/third"));
app.use(appURL + "/page", express.static(__dirname + "/page"));
app.listen(portNumber);
console.log("app initialized");
