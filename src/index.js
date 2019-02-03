import '../css/codemirror.css';
import 'codemirror/addon/lint/lint.css';

import 'jquery.fancytree/dist/skin-lion/ui.fancytree.css';

const $ = require('jquery');
const d3 = require('d3');
const c3 = require('c3');

const jshint = require('jshint');
window.JSHINT = jshint.JSHINT;

const cm = require('codemirror');
require('codemirror/mode/javascript/javascript');
require('codemirror/mode/mllike/mllike');
require('codemirror/addon/lint/lint');
require('codemirror/addon/lint/javascript-lint');

const fancytree = require('jquery.fancytree');
require('jquery.fancytree/dist/modules/jquery.fancytree.edit');
require('jquery.fancytree/dist/modules/jquery.fancytree.filter');

const esprima = require('esprima');

import hotkeys from 'hotkeys-js';

const state = {};

function rebind(key, f, opts) {
  hotkeys.unbind(key);
  if (opts !== undefined) {
    hotkeys(key, f);
  } else {
    hotkeys(key, opts, f);
  }
}


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

function run() {
  console.log("run");
  try {
    const code = state.cm.getDoc().getValue() + "\nmain()";
    eval(code);
  } catch(e) {
    console.log(e);
  }
}

function save() {
  const code = state.cm.getDoc().getValue();

  try {
    const parsed = esprima.parse(code);
    console.log(parsed);

    console.log("save");
  } catch (e) {
    alert("JavaScript parsing failed!");
  }
}

function open() {
  console.log("open");
}

function main() {
  $("head").append(`
  <style>
    i {
      border: solid black;
      border-width: 0 4px 4px 0;
      display: inline-block;
      padding: 4px;
      position: relative;
      top: -4px;
      margin-right: 6px;
    }

    .right {
      transform: rotate(-45deg);
      -webkit-transform: rotate(-45deg);
    }

    .left {
      transform: rotate(135deg);
      -webkit-transform: rotate(135deg);
    }

    .up {
      transform: rotate(-135deg);
      -webkit-transform: rotate(-135deg);
    }

    .down {
      transform: rotate(45deg);
      -webkit-transform: rotate(45deg);
    }

    .hidden {
      display: none;
    }
  </style>
`);

  $("body").append(`
      <a href="#"><h1 id="toggleIntro"><i class="arrown right"></i>Introduction</h1></a>
      <div class="hidden" id="divIntro" style="width: 40em;">
        This is an append-only programming environment where
        you issue patches / commands to create new versions of code.
        Presentation of the evolution of a program is linear and
        is useful for creating tutorials.
        All history is considered useful and bug fixes and updates due to
        dependencies should thus be applied to all historical versions.
        There are a few cases for virtual alterations to be treated differently:
        <ul>
          <li>Update to new version of dependency: Layer patch to all matching function versions</li>
          <li>Bug fix: Layer patch to all matching function versions</li>
          <li>Feature alteration: Named branch</li>
          <li>Forward evolution: New function version</li>
        </ul>
        Redundancy alteration can be treated in various ways. It is designed to apply bug fixes to all versions of program history:
        <ul>
          <li>Structural patch applied to all matching redundancies. Easy forward evolution, but harder patch making.</li>
          <li>
            Avoiding redundancies through structured historical alterations.
            Requires structural patch making on forward evolution, but enables easier bug fixing.
          </li>
        </ul>
      </div>
      <h2>User Profile</h2>
      <p>User name: <span id="username"></span></p>
      <div>
        <div style="float: left; padding-right: 4em; ">
          <h2>Functions</h2>
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
        <div style="float: left;">
          <h2>Program Constructor</h2>
          <textarea id="code" readonly="true"></textarea>
          <input type="button" value="Open (Ctrl+O)"></input>
          <input type="button" value="Run (Ctrl+R)"></input>
          <input type="button" value="Commit (Ctrl+S)"></input>
        </div>
        <div style="float: left;">
          <h2>Program Result</h2>
          <textarea id="codeOut" readonly="true"></textarea>
        </div>
      </div>
  `);

  $("#toggleIntro").click(function() {
    $("#toggleIntro > i").toggleClass("down");
    $("#toggleIntro > i").toggleClass("right");
    $("#divIntro").toggleClass("hidden");
  });

  $('#funtree').fancytree({
    checkbox: true,
    selectMode: 3,
    source:
    [
       {
         title: "sum",
         folder: true
         /*
         children: [
           { title: "child1" },
           { title: "child2" }
         ]
         */
       },
      {
        title: "main",
        folder: true
      }
    ]
  });
  state.funtree = $("#funtree");

  const ta = $("#code")[0];
  state.cm = cm.fromTextArea(ta, {
    lineNumbers: true,
    mode: 'javascript',
    gutters: ["CodeMirror-lint-markers"],
    lint: true
  });

  const ta2 = $("#codeOut")[0];
  state.cmOut = cm.fromTextArea(ta2, {
    lineNumbers: true,
    mode: 'javascript',
    gutters: ["CodeMirror-lint-markers"],
    lint: true
  });

  const hotKeys = {
    'Ctrl-R': run,
    'Ctrl-S': save,
    'Ctrl-O': open
  };

  var opts = {};

  for (var key in hotKeys) {
    const f = hotKeys[key];
    opts[key] = function(f) {
      return function(cm) { f(); };
    }(f);
    const hkey = key.replace('-', '+').replace('Ctrl', 'ctrl');
    rebind(hkey, function(f) {
      return function(evt, handler) {
        evt.preventDefault();
        f();
      };
    }(f));
  }

  state.cm.setOption("extraKeys", opts);

  const code = `function sum(a, b) {
  return a + b;
}

function main() {
  console.log(sum(1, 2));
}`;
  state.cm.getDoc().setValue(code);

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
