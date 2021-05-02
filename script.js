
google.charts.load('current', { packages: ['corechart', 'line'] });
google.charts.setOnLoadCallback(drawRatingHistory);

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
    // resolve(
    //   [
    //     { id: 'tparker24' },
    //     { id: 'abhatnagar23' },
    //     { id: 'mitch-parker' }
    //   ]
    // );
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
    sleep(250);
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

  document.getElementById('loading_status').innerHTML = "loading team members...";
  getTeamMembers('shp-chess-club')
    .then(mbrs => {
      console.log(mbrs.map(m => m.id));
      console.log("loading team members' history...");
      document.getElementById('loading_status').innerHTML = "loading team members' history...";
      setTimeout(() => {

        let members = mbrs.map(m => m.id);
        const maxMembers = 15;
        const startMember = 0 //-59;
        members = (startMember > (- maxMembers - 1))
          ? members.slice(-maxMembers)
          : members.slice(startMember, startMember + maxMembers);
        console.log(members);
        var data = new google.visualization.DataTable();
        data.addColumn('number', 'changeDate');

        let ratingPromises = [];
        for (let i = 0; i < members.length; i++) {
          ratingPromises.push(getMemberRating(members[i], i));
        }

        Promise.all(ratingPromises)
          .then(histRating => {
            // console.log(histRating);
            document.getElementById('loading_status').innerHTML = "";

            const myGame = 'Puzzles';
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

            for (let i = 0; i < gameHistRating.length; i++) {
              data.addColumn('number', gameHistRating[i].member);
            }

            let chartData = [];
            for (let i = 0; i < 365; i++) {
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

            data.addRows(chartData);

            var options = {
              hAxis: {
                title: 'Days Ago',
                direction: -1
              },
              vAxis: {
                title: 'Rating'
              },
              backgroundColor: '#EFEFEF',
              'title': 'SHP Chess Club Rating: ' + myGame,
              'width': 1000,
              'height': 750
            };

            var chart = new google.visualization.LineChart(document.getElementById('chart_div'));
            chart.draw(data, options);
          })
          .catch(
            err => {
              console.log(err);
            }
          );
      });
    })
    .catch(
      err => {
        console.log(err);
      }
    );
}