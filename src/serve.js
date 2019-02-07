const express = require('express');
const session = require('express-session');
const app = express();
const fs = require('fs');
const port = 8080;
const path = require('path');

const proxy = require('express-http-proxy');

const bodyParser = require('body-parser');

// Type 2: Persistent datastore with manual loading
const Datastore = require('nedb');

const db = new Datastore({ filename: './sub/js-commander.db' });

const pwd = __dirname;

const homedir = require('os').homedir();

// TODO: get homedir from node
const sessionSecret = fs.readFileSync(path.join(homedir, 'js-commander.pwd'), 'utf8');

const NedbStore = require('nedb-session-store')(session);
    
const dname = path.join(path.dirname(pwd), 'sub', 'src');

db.loadDatabase(function (err) {
  // Removing all documents with the 'match-all' query
  /*
  db.remove({}, { multi: true }, function (err, numRemoved) {

  });
  */

  app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
    store: new NedbStore({
      filename: path.join(homedir, 'js-commander.session')
    })
  }));

  app.use(function (req, res, next) {
    if (!req.session.user) {
      db.update(
        { doc: 'users' },
        { $inc: { userCount: 1 } },
        {
          upsert: true,
          returnUpdatedDocs: true
        },
        function(err, numReplaced, upsert) {
          console.log("upsert", upsert);
          const user = 'anon' + upsert.userCount;
          const doc = {
            user: user,
            created: new Date().getTime(),
          };
          db.insert(doc, function(err, newDoc) {
            console.log(newDoc);
            req.session.user = user;
            next();
          });
        });
    } else {
      next();
    }
  });

  app.use(bodyParser.urlencoded({ extended: true }));

  app.use(bodyParser.json());

  app.get('/', (request, response) => {
    response.redirect('/index');
  });

  //app.use(express.static('public'));

  app.get('/listfiles', (request, response) => {
    const files = fs.readdirSync(dname);
    response.send(JSON.stringify(files));
  });

  app.get('/commands', (request, response) => {
    db.find({ doc: 'cmd' }).sort({ timestamp: 1 }).exec(function (err, docs) {
      response.send(JSON.stringify(docs));
    });
  });
  
  app.get('/functions', (request, response) => {
    db.find({ doc: 'fun' }).sort({ funName: 1 }).exec(function (err, docs) {
      response.send(JSON.stringify(docs));
    });
  });
  
  
  app.get('/app', (request, response) => {
    const fname = request.query.fname;
    const files = fs.readdirSync(dname);
    if (files.indexOf(fname) >= 0) {
      const fpath = path.join(dname, fname);
      const data = fs.readFileSync(fpath, 'utf8');
      response.send(data);
    } else {
      response.status(500).send("No such file");
    }
  });

  app.get('/fun', (request, response) => {
    const funName = request.query.funName;
    db.find({
      doc: 'fun',
      funName: funName,
      user: request.session.user
    }).sort({ timestamp: 1 })
      .exec(function (err, docs) {
        if (err) {
          response.status(500).send("Error: " + err.toString());
          return;
        }
        response.send(JSON.stringify(docs));
    });
  });

  app.get('/username', (request, response) => {
    response.send(request.session.user);
  });

  app.post('/postfun', (request, response) => {
    const body = request.body;
    const fname = body.fname;
    const funName = body.funName;
    const value = body.value;

    if (value === undefined || value === '') {
      response.status(500).send("Error: empty message");
      return;
    }

    const doc = {
      doc: 'fun',
      fname: fname,
      funName: funName,
      user: request.session.user,
      app: value,
      timestamp: new Date().getTime()
    };

    db.update(
      {
        doc: 'fun',
        fname: fname,
        funName: funName,
        user: request.session.user
      },
      doc,
      {
        upsert: true,
        returnUpdatedDocs: true
      },
      function(err, numReplaced, newDoc) {
        if (err) {
          response.status(500).send("Error: " + err.toString());
          return;
        }
        //console.log(newDoc);
        response.send(JSON.stringify(newDoc));
      }
    );
  });

  app.post('/postapp', (request, response) => {
    const body = request.body;
    const fname = body.fname;
    
    const files = fs.readdirSync(dname);
    if (files.indexOf(fname) < 0) {
      response.status(500).send("Error: fname");
      return;
    }

    const value = body.value;

    if (value === undefined || value === '') {
      response.status(500).send("Error: empty message");
      return;
    }

    const doc = {
      doc: 'app',
      fname: fname,
      user: request.session.user,
      app: value,
      timestamp: new Date().getTime()
    };

    if (!fs.existsSync(dname)) {
      fs.mkdirSync(dname);
    }

    const fpath = path.join(dname, fname);
    fs.writeFileSync(fpath, value);

    db.update(
      {
        doc: 'app',
        fname: fname,
        user: request.session.user
      },
      doc,
      {
        upsert: true,
        returnUpdatedDocs: true
      },
      function(err, numReplaced, newDoc) {
        if (err) {
          response.status(500).send("Error: " + err.toString());
          return;
        }
        //console.log(newDoc);
        response.send(JSON.stringify(newDoc));
      }
    );
  });

  app.post('/postcmd', (request, response) => {
    const body = request.body;
    const value = body.value;

    if (value === undefined || value === '') {
      response.send("Error: empty message");
      return;
    }

    const doc = {
      doc: 'cmd',
      user: request.session.user,
      cmd: value,
      timestamp: new Date().getTime()
    };

    db.insert(doc, function(err, newDoc) {
      //console.log(newDoc);
      response.send(JSON.stringify(newDoc));
    });
  });

  app.use('/', proxy('localhost:8081'));

  app.listen(port, 'localhost', (err) => {
    if (err) {
      return console.log('something bad happened', err);
    }

    console.log(`server is listening on ${port}`);


  });

});
