"use strict";
const fileSystem = require("fs");
const multer = require("multer");
const uploader = multer({ inMemory: true });
const appURL = "/MoarGif";
const express = require("express");
const app = express();
const portNumber = 9001;
const latinAlphabetLetters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
app.listen(portNumber);
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
const pageHandler = function(request, response) {
	let pageName = request.query.page;
	if (pageName == undefined) {
		pageName = "main";
	}
	const content = loadPage(pageName);
	response.send(content);
};
const convertHandler = function(request, response, next) {
	console.log(request.file);
};
app.get(appURL, pageHandler);
app.post(appURL + "/convertImage", uploader.single("file"), convertHandler);
app.use(appURL + "/third", express.static("third"));
app.use(appURL + "/page", express.static("page"));
console.log("app initialized");