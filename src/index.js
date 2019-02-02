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
}

/*
function jslint() {
  const widgets = [];
  const editor = state.cm;
  editor.operation(function() {
    console.log("op");
    for (var i = 0; i < widgets.length; ++i) {
      editor.removeLineWidget(widgets[i]);
    }
    widgets.length = 0;

    const code = editor.getDoc().getValue();
    const errors = function() {
      try {
        const syntax = esprima.parse(code, { tolerant: true, loc: true });
        const errors = syntax.errors;
        return errors;
      } catch (e) {
        return [e];
      }
    }();

    console.log("parsed", errors);

    for (var i = 0; i < errors.length; ++i) {
      var err = errors[i];
      if (!err) continue;
      console.log("err", err);
      var msg = document.createElement("div");
      var icon = msg.appendChild(document.createElement("span"));
      icon.innerHTML = "!!";
      icon.className = "lint-error-icon";
      msg.appendChild(document.createTextNode(err.description));
      msg.className = "lint-error";
      widgets.push(editor.addLineWidget(err.lineNumber - 1, msg, {coverGutter: false, noHScroll: true}));
    }
  });
}
*/

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
        <div style="float: left;">
          <textarea id="code" readonly="true" rows="40" cols="80"></textarea>
          <input type="button" value="Open (Ctrl+O)"></input>
          <input type="button" value="Run (Ctrl+R)"></input>
          <input type="button" value="Commit (Ctrl+S)"></input>
        </div>
      </div>
  `);

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
