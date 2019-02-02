import cm_css from '../css/codemirror.css';

import 'jquery.fancytree/dist/skin-lion/ui.fancytree.css'

const $ = require('jquery');
const d3 = require('d3');
const c3 = require('c3');

const cm = require('codemirror');
require('codemirror/mode/javascript/javascript');
require('codemirror/mode/mllike/mllike');

const fancytree = require('jquery.fancytree');
require('jquery.fancytree/dist/modules/jquery.fancytree.edit');
require('jquery.fancytree/dist/modules/jquery.fancytree.filter');

const esprima = require('esprima');

const state = {};

function handleCmd(cmd) {
  const tokens = cmd.split(' ');
  switch (tokens[0]) {
    case 'md':
    case 'mkdir':
      {
        const folder = tokens[1];
        const tree = state.funtree.fancytree("getTree");
        const active = tree.getActiveNode();
        const par = active != null ? active : tree.rootNode;
        console.log("par", par);
        par.addChildren({ title: folder });
        break;
      }
    case 'rd':
    case 'rmdir':
      {
        const folder = tokens[1];
        break;
      }
  }
}

function getCmds() {
  $.get("/commands", function(data) {

    // List command history
    const dp = JSON.parse(data);
    console.log(dp);
    $("#commands").empty();
    const listStyle = "style='padding-bottom: 2em;'";
    for (let i = 0; i < dp.length; i++) {
      const id = dp[i]._id;
      const ts = dp[i].timestamp;
      const date = new Date(ts);
      const user = dp[i].user;
      const cmd = dp[i].cmd;
      const choices = dp[i].tags;
      //$("#commands").append("<li " + listStyle + ">" + dp[i].cmd + "</li>")
    }

    // Add input box
    $("#commands").append(`
      <div id="inputbox">
        <b>Input: </b><input id="cmdinput"type="text"></input>
      </div>
      `);

    // Handle input
    $("#cmdinput").on('keypress', function(e) {
      if (e.which == 13) {
        handleCmd($("#cmdinput").val());
        $("#cmdinput").val("");
        /*
        $.post("./postcmd", {
          value: $("#cmdinput").val()
        }, function(data) {
          getCmds();
          $("#cmdinput").val("");
        });
        */
      }
    });

    $("#cmdinput").focus();
  });
}

function main() {
  $("body").append(`
      <h1>Introduction</h1>
      <p>This is a programming environment where you issue commands to create blocks of code.</p>
      <p>User: <span id="username"></span></p>
      <div>
        <h3>Functions</h3>
        <div style="float: left; padding-right: 4em; ">
          <div id="funtree">
            <!--
            <ul>
              <li>root1</li>
              <li>root2</li>
            </ul>
            -->
          </div>
          <ul id="commands"></ul>
        </div>
        <textarea id="code" readonly="true" rows="40" cols="80" style="float: left;"></textarea>
      </div>
  `);

  $('#funtree').fancytree({
   'source':
    [
       {
         title: "sum"
         /*
         children: [
           { title: "child1" },
           { title: "child2" }
         ]
         */
       },
      {
        title: "main"
      }
    ]
  });
  state.funtree = $("#funtree");

  const ta = $("#code")[0];
  state.cm = cm.fromTextArea(ta, {
    lineNumbers: true,
    mode: 'javascript'
  });

  const code = `function sum(a, b) {
  return a + b;
}`;
  state.cm.getDoc().setValue(code);

  const parsed = esprima.parse(code);



  console.log(parsed);

  $.get("/username", function(data) {
    $("#username").html(data);
  });

  getCmds();

  /*
  $("#inputbox")
    .css("position", "absolute")
    .css("top", $("#commands").bottom())
    .css("left", $("#commands").left());
    */

};

$(main);
