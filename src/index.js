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

import { throttle, debounce } from 'throttle-debounce';

const state = {};

function rebind(key, f, opts) {
  hotkeys.unbind(key);
  if (opts !== undefined) {
    hotkeys(key, f);
  } else {
    hotkeys(key, opts, f);
  }
}

function getApp() {
  $.get("/app", function(data) {
    const dp = JSON.parse(data);
    if (
      dp !== undefined &&
      dp[0] !== undefined &&
      dp[0].app !== undefined) {
      const code = dp[0].app;
      state.cm.getDoc().setValue(code);
    }
  });
}

function save() {
  const code = state.cm.getDoc().getValue();

  try {
    const parsed = esprima.parse(code);
    console.log(parsed);

    $.post("./postapp", {
      value: code
    }, function(data) {
    });

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

    body {
      width: 100vw;
      height: 100vh;
      overflow: hidden;
    }

    #output {
      position: absolute;
      right: 0px;
      bottom: 0px;
    }
  </style>
`);

  $("body").append(`
      <a href="#"><h1 id="toggleIntro"><i class="arrown right"></i>Introduction</h1></a>
      <div class="hidden" id="divIntro" style="width: 40em;">
        This is a differential programming environment where
        you create new versions of code using the immer library.
        Presentation of the evolution of a program is linear (or tree-shaped) and
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
            This is the approach taken.
          </li>
        </ul>
      </div>
      <h2>User Profile</h2>
      <p>User name: <span id="username"></span></p>
      <div id="mainContent" style="display: inline-block; border: 1px solid black;">
        <div style="float: left;">
          <h2>sub/src/index.js</h2>
          <textarea id="code" readonly="true"></textarea>
          <input type="button" value="Save and run (Ctrl+S)"></input>
        </div>
      </div>
      <iframe id="output" src="http://localhost:8081/index">
      </iframe>
  `);

  $("#toggleIntro").click(function() {
    $("#toggleIntro > i").toggleClass("down");
    $("#toggleIntro > i").toggleClass("right");
    $("#divIntro").toggleClass("hidden");
  });

  const ta = $("#code")[0];
  state.cm = cm.fromTextArea(ta, {
    lineNumbers: true,
    mode: 'javascript',
    gutters: ["CodeMirror-lint-markers"],
    lint: true
  });

  const hotKeys = {
    'Ctrl-S': save
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

  // CODE HERE
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

  getApp();

  const doResize = function() {
    const m = $("#mainContent");
    const dockLeft = false;
    if (dockLeft) {
      const ch = m.offset().top + 5;
      const cw = m.offset().left + m.width() + 5;
      const h = window.innerHeight - ch;
      const w = window.innerWidth - cw;
      $("#output").height(h);
      $("#output").width(w);
    } else {
      const ch = m.offset().top + m.height() + 5;
      const cw = m.offset().left + 5;
      const h = window.innerHeight - ch;
      const w = window.innerWidth - cw;
      $("#output").height(h);
      $("#output").width(w);
    }
    //console.log("resize");
  };
  doResize();
  $(window).resize(doResize);
  $("#mainContent").on("DOMSubtreeModified", throttle(1000, doResize));
  setTimeout(doResize, 0);
};

$(main);
