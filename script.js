
// import { Bottleneck } from './node_modules/bottleneck/lib/Bottleneck';
// var Bottleneck = require("bottleneck");

google.charts.load('current', { packages: ['corechart', 'line'] });
google.charts.setOnLoadCallback(drawRankingHistory);

function ndjsonToArray(ret) {
  let retArray = ret.split('\n');
  ret = [];
  for (let mbr of retArray) {
    if (mbr.length > 2) ret.push(JSON.parse(mbr));
  }
  return ret;
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

function drawRankingHistory() {

  // const limiter = new Bottleneck({
  //   minTime: 333,
  //   maxConcurrent: 1
  // });

  getTeamMembers('shp-chess-club').then(mbrs => {
    console.log(mbrs.map(m => m.id));
    let members = mbrs.map(m => m.id);
    members = members.slice(-10);
    console.log(members);
    // members = ['tparker24','mitch-parker'];

    var data = new google.visualization.DataTable();
    data.addColumn('number', 'changeDate');
    for (let i = 0; i < members.length; i++) {
      data.addColumn('number', members[i]);
    }

    let rankingPromises = [];
    for (let i = 0; i < members.length; i++) {
      // data.addColumn('number', members[i]);
      // rankingPromises.push(limiter.schedule(() => getMemberRanking(members[i])));
      rankingPromises.push(getMemberRanking(members[i]));
    }

    Promise.all(rankingPromises)
      .then(histRanking => {
        console.log(histRanking);

        const myGame = 'Rapid';
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
          let rankDate = new Date();
          targetDate.setDate(targetDate.getDate() - i);
          gameHistRanking.forEach((member) => {
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
          'title': 'SHP Chess Club Ranking: Rapid',
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
  })
    .catch(
      err => {
        console.log(err);
      }
    );

}