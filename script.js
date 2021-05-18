let data = null;
let chart = null;
let mbrs = null;
let mbrHistory = [];
let options = {};
let startMember = 0;
let filteredMbrs;
let myGame = 'Blitz';

google.charts.load('current', { packages: ['corechart', 'line'] });


// starts drawing process
function loadChart(menuGame) {
  startMember = 0;
  myGame = menuGame;
  console.log(myGame);
  document.getElementById("nav-btn1").style.visibility = "visible";
  document.getElementById("nav-btn2").style.visibility = "visible";
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

// gets all members of given team
var getTeamMembers = function (team) {
  return new Promise((resolve, reject) => {
    // only fetch from lichess API if we haven't already gotten the team members
    if (mbrs != null) {
      resolve(mbrs);
      return;
    }
    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", "https://lichess.org/api/team/" + team + "/users", true);
    xhttp.onload = function () {
      if (this.readyState == 4 && this.status == 200) {
        let ret = xhttp.responseText;
        ret = ndjsonToArray(ret);
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


//gets rating history for given member, idx is never used but i don't want to take it out in case it breaks something lol
var getMemberRating = (member, idx) => {
  return new Promise((resolve, reject) => {
    // only fetch from lichess API if we don't already have that member's history
    if (mbrHistory[member] != null) {
      resolve(mbrHistory[member]);
      return;
    }
    sleep(350);
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



function drawRatingHistory() {

  data = new google.visualization.DataTable();
  chart = new google.visualization.LineChart(document.getElementById('chart_div'));
  data.addColumn('number', 'changeDate');
  document.getElementById('loading_status').innerHTML = "Loading team members...";
  getTeamMembers('shp-chess-club')
    .then(ret => {
      mbrs = ret;
      console.log(mbrs);
      var perfGame;
      if (myGame.toLowerCase() == 'puzzles') {
        perfGame = 'puzzle';
      } else if (myGame.toLowerCase() == 'racing kings'){
        perfGame = 'racingKings';
      } else if (myGame.toLowerCase() == 'king of the hill'){
        perfGame = 'kingOfTheHill';
      } else if (myGame.toLowerCase() == 'three-check'){
        perfGame = 'threeCheck';
      } else {
        perfGame = myGame.toLowerCase();
      }
      // console.log(mbrs.perfs);
      // console.log(mbrs[20]['perfs']['puzzle']['games']);
      filteredMbrs = mbrs.filter(m => m['perfs'][perfGame] !== undefined);
      filteredMbrs = filteredMbrs.filter(m => m.id != 'leggiadravendetta' && m.id != 'ahamrah23');
      console.log(filteredMbrs);
      filteredMbrs = filteredMbrs.filter(m => m['perfs'][perfGame]['games'] > 0);
      filteredMbrs.sort((a, b) => b["perfs"][perfGame]["rating"] - a["perfs"][perfGame]["rating"]);
      console.log(filteredMbrs.map(m => m.id));

      getMemberHistory(myGame);
    })
    .catch(
      err => {
        console.log(err);
      }
    );
}


//next and prev buttons
function next() {
  getMemberHistory(myGame, 10);
}
function prev() {
  getMemberHistory(myGame, -10);
}


function getMemberHistory(myGame, addMember = 0) {
  let maxPoints = 0;
  let minPoints = 8000;

  document.getElementById('loading_status').innerHTML = "Loading team members' history...";
  startMember += addMember;
  startMember = Math.min(filteredMbrs.length - 10, startMember);
  startMember = Math.max(0, startMember);
  setTimeout(() => {

    let members = filteredMbrs.map(m => m.id);
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
            height: 750
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