"use strict";
const fileSystem = require("fs");
const appURL = "/MoarGif";
const express = require("express");
const app = express();
const portNumber = 9001;
const latinAlphabetLetters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
app.listen(portNumber);
const loadLayoutString = function() {
    return fileSystem.readFileSync(__dirname + "/page/layout.html", "utf8");
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
    return content;
};
const substituteTemplate = function(text) {
    return text.replace("$appURL", appURL);
}
const loadPage = function(pageName) {
    let result = null;
    const layout = substituteTemplate(loadLayoutString());
    const content = loadPageString(pageName);
    if (content != null) {
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
app.get(appURL, pageHandler);
console.log("app initialized");