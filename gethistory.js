const cron = require('node-cron');
const express = require('express');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const fs = require('fs');
const myTeam = 'shp-chess-club';
let mbrs = null;
let mbrHistory = [];
let ratingPromises = [];

app = express();

cron.schedule('* * * * * *', function () {
    console.log('1');
})

function ndjsonToArray(ret) {
    let retArray = ret.split('\n');
    ret = [];
    for (let mbr of retArray) {
        if (mbr.length > 2) ret.push(JSON.parse(mbr));
    }
    return ret;
}

function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}

var getTeamMembers = function (team) {
    return new Promise((resolve, reject) => {
        var xhttp = new XMLHttpRequest();
        xhttp.open("GET", "https://lichess.org/api/team/" + myTeam + "/users", true);
        xhttp.onload = function () {
            if (this.readyState == 4 && this.status == 200) {
                // console.log(xhttp.responseText);
                // let ret = JSON.parse(xhttp.responseText);
                let ret = ndjsonToArray(xhttp.responseText);
                resolve(ret);
            }
        };
        xhttp.onerror = () => {
            reject({
                status: xhttp.status,
                statusTest: xhttp.statusText
            });
        };
        xhttp.send();
    });
}

var getMemberRating = (member) => {
    return new Promise((resolve, reject) => {
        // only fetch from lichess API if we don't already have that member's history
        if (mbrHistory[member] != null) {
            resolve(mbrHistory[member]);
            return;
        }
        sleep(1000);
        var xhttp = new XMLHttpRequest();
        xhttp.open("GET", "https://lichess.org/api/user/" + member + "/rating-history", true);
        xhttp.onload = function () {
            if (this.readyState == 4 && this.status == 200) {
                var ret = JSON.parse(xhttp.responseText);
                mbrHistory[member] = {
                    member: member,
                    history: ret
                };
                resolve(mbrHistory[member]);
            }
        };
        xhttp.onerror = () => {
            reject({
                status: xhttp.status,
                statusText: xhttp.statusText
            });
        };
        xhttp.send();
    });
}


getTeamMembers().then((ret) => {
    for (let i = 0; i < ret.length; i++) {
        console.log(ret[i]['id']);
        ratingPromises.push(getMemberRating(ret[i]['id']));
    }
    
    
    Promise.all(ratingPromises).then((e) => {
        fs.writeFileSync('member-data.json', e);
    });
    // console.log(ret);
});