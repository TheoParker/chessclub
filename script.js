
google.charts.load('current', { packages: ['corechart', 'line'] });
google.charts.setOnLoadCallback(drawRatingHistory);
let data = null;
let chart = null;
let mbrs = null;
let startMember = 0;
const myGame = 'Blitz';

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

var getMemberRating = (member, idx) => {
  return new Promise((resolve, reject) => {
    sleep(350);
    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", "https://lichess.org/api/user/" + member + "/rating-history", true);
    xhttp.onload = function () {
      if (this.readyState == 4 && this.status == 200) {
        var ret = JSON.parse(JSON.parse(xhttp.responseText));
        resolve({
          member: member,
          history: ret
        });
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
  document.getElementById('loading_status').innerHTML = "loading team members...";
  getTeamMembers('shp-chess-club')
    .then(ret => {
      mbrs = ret;
      console.log(mbrs);
      mbrs = mbrs.filter(m => m.perfs.blitz.games > 0);
      mbrs.sort((a,b) => b.perfs.blitz.rating - a.perfs.blitz.rating);
      console.log(mbrs.map(m => m.id));

      getMemberHistory(myGame);
    })
    .catch(
      err => {
        console.log(err);
      }
    );
}

function next() {
  getMemberHistory(myGame, 10);
}
function prev() {
  getMemberHistory(myGame, -10);
}

function getMemberHistory(myGame, addMember = 0) {
  document.getElementById('loading_status').innerHTML = "loading team members' history...";
  startMember += addMember;
  startMember = Math.min(mbrs.length - 10, startMember);
  startMember = Math.max(0, startMember);
  setTimeout(() => {

    let members = mbrs.map(m => m.id);
    const maxMembers = 10;
    members = members.slice(startMember, maxMembers + startMember);
    console.log(members);

    let ratingPromises = [];
    for (let i = 0; i < members.length; i++) {
      ratingPromises.push(getMemberRating(members[i], i));
    }

    Promise.all(ratingPromises)
      .then(histRating => {
        document.getElementById('loading_status').innerHTML = "calculating team members' history...";
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
          if (data.getNumberOfColumns() > 1 ) {
             data.removeColumns(1, data.getNumberOfColumns() - 1);
          }

          for (let i = 0; i < gameHistRating.length; i++) {
            data.addColumn('number', (startMember + i + 1) + ') ' + gameHistRating[i].member);
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
              })
              dateData.push(points);
              // 
            });
            chartData.push(dateData);
          }

          console.log(chartData);

          document.getElementById('loading_status').innerHTML = "";
          data.addRows(chartData);

          var options = {
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
            },
            width: 1000,
            height: 750
          };

          chart.draw(data, options);

        },0);
      })
      .catch(
        err => {
          console.log(err);
        }
      );
  },0);
}