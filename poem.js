"use strict";

function fetchText(url, page) {
    return parsePage(url, page, "text", 0)
        .then(function(response) {return response.parse.text;});
}

function fetchParams(url, params) {
    url = url + "?origin=*";
    Object.keys(params).forEach(function(key) {url += "&" + key + "=" + params[key];});
    return fetch(url)
        .then(function(response) {return response.json();})
        .catch(function(error) {console.log(error);});
}

function parsePage(url, page, prop, section = null) {
    let params = {
        action: "parse",
        page: page,
        prop: prop,
        format: "json",
    }
    if (!(section === null)) {
        params["section"] = section;
    }

    return fetchParams(url, params);
}

function extractPoem(text) {
    let parser = new DOMParser().parseFromString(text, "text/html");
    let section = parser.getElementById("headertemplate").parentNode;
    let poem = {};
    let children = Array.from(section.children);
    let i = 0;
    let child;
    let body = document.createElement("div");
    while (i < children.length && children[i].id != "headertemplate") {
        i += 1;
    }
    poem["header"] = children[i].children[0].outerHTML;
    i += 1;
    while (i < children.length && children[i].id != "ws-footer-inline") {
        body.append(children[i]);
        i += 1;
    }
    poem["poem"] = body.innerHTML;
    return poem;
}

function chooseAuthor(url) {
    let params = {
        action: "query",
        list: "categorymembers",
        cmtitle: "Category:Поэзия_по_авторам",
        cmtype: "subcat",
        cmlimit: 500,
        format: "json",
    };
    return fetchParams(url, params)
        .then(function(response) {return response.query.categorymembers;})
        .then(function(authors) {return authors[Math.floor(Math.random() * authors.length)];})
        .then(function(author) {return author.pageid;})
}

function choosePageFrom(url, author) {
    let params = {
        action: "query",
        list: "categorymembers",
        cmpageid: author,
        cmtype: "page",
        cmlimit: 500,
        format: "json",
    };
    return fetchParams(url, params)
        .then(function(response) {return response.query.categorymembers;})
        .then(function(pages) {return pages[Math.floor(Math.random() * pages.length)];})
        .then(function(page) {return page.title;})
        .catch(function(error) {console.log(error);});
}


function choosePage(url) {
    return chooseAuthor(url)
        .then(function(author) {return author;})
        .then(function(author) {return choosePageFrom(url, author);})
        .then(function(page) {console.log(page); return page})
        .catch(function(error) {console.log(error);});
}

function insertPoem(poem) {
    for (let key in poem) {
        let elm = document.getElementById(key);
        if (elm) {
            elm.innerHTML = poem[key];
        }
    }
}

function getPoem() {
    let url = "https://ru.wikisource.org/w/api.php";

    let poem = document.getElementById('poem');
    let hdr = document.getElementById('header');
    choosePage(url)
        .then(function(page) {return fetchText(url, page);})
        .then(function(response) {
            return DOMPurify.sanitize(response["*"]);
        })
        // .then(function(text) {console.log(text); return new DOMParser().parseFromString(text, "text/html");})
        // .then(function(text) {return text.getElementById('mw-content-text');})
        .then(function(text) { return extractPoem(text); return text; })
        // .then(function(text) {
        //     return {
        //         poem: text,
        //     }
        // })
        .then(function(poem) { insertPoem(poem); })
        .catch(function(error) {console.log(error);});
}
    
document.getElementById('get_poem').addEventListener("click", getPoem);
