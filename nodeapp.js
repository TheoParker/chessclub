// const fr = new FileReader();

let data = null;
let chart = null;
let mbrs;
let teamHistory = [];
let mbrHistory = [];
let options = {};
let startMember = 0;
let filteredMbrs;
let myGame = 'Blitz';
let btndisplay = false;
var mdata;


var getDataFromFile = () => {
    return new Promise((resolve, reject) => {
        var xhttp = new XMLHttpRequest();
        xhttp.open("GET", "http://127.0.0.1:5500/member-data.json", true);
        xhttp.onload = function () {
            if (this.readyState == 4 && this.status == 200) {
                let ret = xhttp.responseText;
                resolve(ret);
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

google.charts.load('current', { packages: ['corechart', 'line'] });


// starts drawing process
function loadChart(menuGame) {

    if (btndisplay == false) {
        var nbtn1 = document.createElement("BUTTON");
        nbtn1.innerHTML = "|<<";
        nbtn1.classList.add("btn");
        nbtn1.classList.add("nav-btn");
        nbtn1.setAttribute("id", "nav-btn1");
        nbtn1.setAttribute("onclick", "prev()");
        var nbtn2 = document.createElement("BUTTON");
        nbtn2.innerHTML = ">>|";
        nbtn2.classList.add("btn");
        nbtn2.classList.add("nav-btn");
        nbtn2.setAttribute("id", "nav-btn2");
        nbtn2.setAttribute("onclick", "next()");

        document.getElementById("navbtnlistid").appendChild(nbtn1);
        document.getElementById("navbtnlistid").appendChild(nbtn2);
        document.getElementById("navbtnlistid").style.margin = "10px";
        document.getElementById("navbtnlistid").style.marginTop = "0px";

        var idiv = document.getElementById("imgdiv");
        idiv.remove();

        btndisplay = true;
    }

    startMember = 0;
    myGame = menuGame;
    console.log(myGame);



    // document.getElementById("nav-btn1").style.visibility = "visible";
    // document.getElementById("nav-btn2").style.visibility = "visible";
    google.charts.setOnLoadCallback(drawRatingHistory);
}



//Json parse
function ndjsonToArray(ret) {
    let retArray = ret.split('\n');
    ret = [];
    for (let mbr of retArray) {
        if (mbr.length > 2) ret.push(JSON.parse(mbr));
    }
    return ret;
}

//sleep
function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}


//next and prev buttons
function next() {
    getMemberHistory(myGame, 10);
}
function prev() {
    getMemberHistory(myGame, -10);
}


function drawRatingHistory() {

    data = new google.visualization.DataTable();
    chart = new google.visualization.LineChart(document.getElementById('chart_div'));
    data.addColumn('number', 'changeDate');
    document.getElementById('loading_status').innerHTML = "Loading team members...";
    console.log(mbrs);
    if (mbrs != null) {
        console.log(mbrs);
        var perfGame;
        switch (String(myGame)) {
            case 'Bullet':
                perfGame = 0;
                break;
            case 'Blitz':
                perfGame = 1;
                break;
            case 'Rapid':
                perfGame = 2;
                break;
            case 'Classical':
                perfGame = 3;
                break
            case 'Antichess':
                perfGame = 8;
                break;
            case 'UltraBullet':
                perfGame = 14;
                break;
            case 'Puzzles':
                perfGame = 13;
                break;
            case 'Chess960':
                perfGame = 5;
                break;
            case 'Crazyhouse':
                perfGame = 12;
                break;
            default:
                break;
        }
        console.log(mdata);
        // console.log(perfGame);
        // console.log(mdata[0]['history'][perfGame]['points']);
        // for (let i = 0; i < mdata.length; i++){
        //     console.log(mdata[i]['history']);
        // }
        // filteredMbrs = mdata.filter(m => m['history'][perfGame] !== undefined);
        filteredMbrs = mdata.filter(m => m['history'].length != 0);

        console.log(mdata);
        filteredMbrs = filteredMbrs.filter(m => m['history'][perfGame]['points'].length != 0);
        filteredMbrs = filteredMbrs.filter(m => m['member'] != 'leggiadravendetta' && m['member'] != 'ahamrah23');
        console.log(filteredMbrs);
        // filteredMbrs = filteredMbrs.filter(m => m['perfs'][perfGame]['games'] > 0);
        filteredMbrs.sort((a, b) => b['history'][perfGame]['points'][b['history'][perfGame]['points'].length - 1][3] - a['history'][perfGame]['points'][a['history'][perfGame]['points'].length - 1][3]);
        console.log(filteredMbrs.map(m => m['member']));

        getMemberHistory(myGame);

        return;
    }
    getTeamMembers().then((e) => {
        console.log(mbrs);
        var perfGame;
        switch (String(myGame)) {
            case 'Bullet':
                perfGame = 0;
                break;
            case 'Blitz':
                perfGame = 1;
                break;
            case 'Rapid':
                perfGame = 2;
                break;
            case 'Classical':
                perfGame = 3;
                break
            case 'Antichess':
                perfGame = 8;
                break;
            case 'UltraBullet':
                perfGame = 14;
                break;
            case 'Puzzles':
                perfGame = 13;
                break;
            case 'Chess960':
                perfGame = 5;
                break;
            case 'Crazyhouse':
                perfGame = 12;
                break;
            default:
                break;
        }

        // console.log(mbrs.perfs);
        // console.log(mbrs[20]['perfs']['puzzle']['games']);
        console.log(mdata);
        // console.log(perfGame);
        // console.log(mdata[0]['history'][perfGame]['points']);
        // for (let i = 0; i < mdata.length; i++){
        //     console.log(mdata[i]['history']);
        // }
        // filteredMbrs = mdata.filter(m => m['history'][perfGame] !== undefined);
        filteredMbrs = mdata.filter(m => m['history'].length != 0);

        console.log(mdata);
        filteredMbrs = filteredMbrs.filter(m => m['history'][perfGame]['points'].length != 0);
        filteredMbrs = filteredMbrs.filter(m => m['member'] != 'leggiadravendetta' && m['member'] != 'ahamrah23');
        console.log(filteredMbrs);
        // filteredMbrs = filteredMbrs.filter(m => m['perfs'][perfGame]['games'] > 0);
        filteredMbrs.sort((a, b) => b['history'][perfGame]['points'][b['history'][perfGame]['points'].length - 1][3] - a['history'][perfGame]['points'][a['history'][perfGame]['points'].length - 1][3]);
        console.log(filteredMbrs.map(m => m['member']));

        getMemberHistory(myGame);

    });


}

var getTeamMembers = function () {

    return new Promise((resolve, reject) => {
        getDataFromFile().then((e) => {
            // console.log(e);
            mbrs = [];
            mdata = JSON.parse(e);
            console.log(mdata);
            for (let i = 0; i < mdata.length; i++) {
                mbrs.push(mdata[i]['member']);

            }
            // console.log(mbrs);
            resolve(mbrs);
        });
    });

    // return new Promise ((resolve, reject) => {
    //     resolve();
    // });
}
var getMemberRating = (member, idx) => {

    for (let i = 0; i < mdata.length; i++) {
        if (String(mdata[i]['member']) == member) {
            mbrHistory[member] = {
                member: member,
                history: mdata[i]['history']
            }
            return mbrHistory[member];
        }
    }
}


function getMemberHistory(myGame, addMember = 0) {
    let maxPoints = 0;
    let minPoints = 8000;

    document.getElementById('loading_status').innerHTML = "Loading team members' history...";
    startMember += addMember;
    startMember = Math.min(filteredMbrs.length - 10, startMember);
    startMember = Math.max(0, startMember);
    setTimeout(() => {

        let members = filteredMbrs.map(m => m['member']);
        const maxMembers = 10;
        members = members.slice(startMember, maxMembers + startMember);
        console.log(members);

        let ratingPromises = [];
        for (let i = 0; i < members.length; i++) {
            ratingPromises.push(getMemberRating(members[i], i));
        }
        Promise.all(ratingPromises)
            .then(histRating => {
                document.getElementById('loading_status').innerHTML = "Calculating team members' history...";
                setTimeout(() => {

                    let gameHistRating = [];
                    histRating.forEach((member) => {
                        member.history.forEach(game => {
                            if (game.name == myGame) {
                                gameHistRating.push({
                                    member: member.member,
                                    points: game.points
                                });
                            }
                        })
                    });
                    console.log(gameHistRating);

                    if (data.getNumberOfRows() > 0) {
                        data.removeRows(0, data.getNumberOfRows());
                    }
                    console.log(data.getTableProperties());
                    if (data.getNumberOfColumns() > 1) {
                        data.removeColumns(1, data.getNumberOfColumns() - 1);
                    }

                    for (let i = 0; i < gameHistRating.length; i++) {
                        data.addColumn('number', (startMember + i + 1) + ': ' + gameHistRating[i].member + " - " + gameHistRating[i]["points"][gameHistRating[i]["points"].length - 1][3]);
                    }

                    let chartData = [];
                    let numDays = 200;
                    for (let i = 0; i < numDays; i++) {
                        let dateData = [i];
                        let targetDate = new Date();
                        let rankDate = new Date();
                        targetDate.setDate(targetDate.getDate() - i);
                        gameHistRating.forEach((member) => {
                            let points = 0;
                            member.points.forEach((rankChange) => {
                                rankDate.setFullYear(rankChange[0]);
                                rankDate.setMonth(rankChange[1]);
                                rankDate.setDate(rankChange[2]);
                                if (rankDate <= targetDate) {
                                    points = rankChange[3];
                                }
                                if ((points < minPoints) && (points > 0)) {
                                    minPoints = points;
                                }
                                if (points > maxPoints) {
                                    maxPoints = points;
                                }

                            })
                            dateData.push(points);
                            // 
                        });
                        chartData.push(dateData);
                    }

                    console.log(chartData);

                    document.getElementById('loading_status').innerHTML = "";
                    data.addRows(chartData);
                    console.log(minPoints);
                    var options = {
                        chartArea: {
                            width: '55%'
                        },
                        // curveType: 'function',
                        backgroundColor: '#EFEFEF',
                        title: 'SHP Chess Club Rating: ' + myGame,
                        titleTextStyle: {
                            fontName: "Georgia",
                            italic: false
                        },
                        // titlePosition: 'in',
                        legend: {
                            textStyle: {
                                fontName: "Georgia",
                                italic: false
                            },
                        },
                        hAxis: {
                            title: 'Days Ago',
                            titleTextStyle: {
                                fontName: "Georgia",
                                bold: true,
                                italic: false
                            },
                            textStyle: {
                                fontName: "Georgia",
                                format: 'decimal'
                            },
                            direction: -1
                        },
                        vAxis: {
                            title: 'Rating',
                            titleTextStyle: {
                                fontName: "Georgia",
                                bold: true,
                                italic: false
                            },
                            textStyle: {
                                fontName: "Georgia",
                                format: 'decimal'
                            },
                            viewWindow: {
                                min: minPoints - 100,
                                max: maxPoints + 100,
                            }
                        },
                        width: 1000,
                        height: 500
                    };

                    chart.draw(data, options);

                }, 0);
            })
            .catch(
                err => {
                    console.log(err);
                }
            );
    }, 0);
}