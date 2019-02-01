$ = require('jquery');
d3 = require('d3');
c3 = require('c3');

function getCmds() {
  $.get("/commands", function(data) {
    const dp = JSON.parse(data);
    console.log(dp);
    //console.log(dp);
    $("#commands").empty();
    const listStyle = "style='padding-bottom: 2em;'";
    for (let i = 0; i < dp.length; i++) {
      const id = dp[i]._id;
      const ts = dp[i].timestamp;
      const date = new Date(ts);
      const user = dp[i].user;
      const cmd = dp[i].cmd;
      const choices = dp[i].tags;
      $("#commands").append("<li " + listStyle + ">" + dp[i].cmd + "</li>")
    }
  });
}

$("body").append(`
    <h1>Introduction</h1>
    <p>
    This is a programming environment where you issue commands to create blocks of code.
    </p>
    <ul id="commands">
    </ul>
    <h1>Input</h1>
    <p>
      <input id="cmdinput"type="text"></input>
    </p>
`);

$.get("/username", function(data) {
  $("#username").html(data);
});

$("#cmdinput").on('keypress', function(e) {
  if (e.which == 13) {
    $.post("./postcmd", {
      value: $("#cmdinput").val()
    }, function(data) {
      //$("body").append(data);
      getCmds();
      $("#cmdinput").val("");
    });
  }
});

$(function() {
  getCmds();
});
