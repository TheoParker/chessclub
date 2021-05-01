
google.charts.load('current', { packages: ['corechart', 'line'] });
google.charts.setOnLoadCallback(drawBackgroundColor);

function ndjsonToArray(ret) {
  let retArray = ret.split('\n');
  ret = [];
  for (mbr of retArray) {
    if (mbr.length > 2) ret.push(JSON.parse(mbr));
  }
  return ret;
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
      // reject({
      //   status: xhttp.status,
      //   statusText: xhttp.statusText
      // });
      resolve(
        [
          { id: 'tparker24' },
          { id: 'mitch-parker' }
        ]
      );
    };
    xhttp.send();
  });
}

var getMemberRanking = (member) => {
  return new Promise((resolve, reject) => {
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

function drawBackgroundColor() {

  getTeamMembers('shp-chess-club').then(mbrs => {
    console.log(mbrs.map(m => m.id));
    let members = mbrs.map(m => m.id);
    console.log(members);


    var data = new google.visualization.DataTable();
    data.addColumn('number', 'changeDate');
    for (let i = 0; i < members.length; i++) {
      data.addColumn('number', members[i]);
    }

    let rankingPromises = [];
    for (let i = 0; i < members.length; i++) {
      // data.addColumn('number', members[i]);
      rankingPromises.push(getMemberRanking(members[i]));
    }

    Promise.all(rankingPromises)
      .then(histRanking => {
        console.log(histRanking);

        const myGame = 'Puzzles';
        let gameHistRanking = [];
        histRanking.forEach((member) => {
          member.history.forEach(game => {
            if (game.name == myGame) {
              gameHistRanking.push({
                member: member.member,
                points: game.points
              });
            }
          })
        });
        console.log(gameHistRanking);

        let chartData = [];
        for (let i = 0; i < 365; i++) {
          let dateData = [i];
          let targetDate = new Date();
          targetDate.setDate(targetDate.getDate() - i);
          gameHistRanking.forEach((member) => {
            dateData.push(Math.round((1500 * Math.random())));
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
          backgroundColor: '#EFEFEF'
        };

        var chart = new google.visualization.LineChart(document.getElementById('chart_div'));
        chart.draw(data, options);

      })
      .catch(
        err => {
          console.log(err);
        }
      );
  })
    .catch(
      err => {
        console.log(err);
      }
    );

}