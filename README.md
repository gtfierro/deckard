# Deckard Status Dashboard

Real-time status dashboard for Giles-based deployments. Deckard deployments
will be based off of "views" of an installation, so dashboards can be focused
on specific deployments or sourcenames within a larget installation, rather
than needing to deploy a new instance of Giles for each dashboard.

Deckard will contain several Views:

* Monitor View:
    * executing a metadata query over the archiver to return a list of points
      -- this metadata query will be continuously updated so that it can
      flexibly handle changes in the qualifying sources
    * Each row will contain the Path, UUID, the latest value, the number of values, and the earliest known point
    * Each row will additionally be colored w/ a status.
    * The status "tiers" will be determined by user-defined rules, naively by thresholds on the last time a point reported
* Alarm View:
    * at last, easy-to-use alarms for sMAP!
    * send emails or texts when certain user-defined conditions are met
* Plotter:
    * easily generate permalinks to plot views on the BtrDB plotter


## Setup

You will need 

* [bower](http://bower.io/)
* [npm](https://docs.npmjs.com/getting-started/installing-node)

which are both fairly standard JS tools. The individual packages we are using
can be found in `package.json` for server-side packages, and `bower.json` for
client-side packages. To install everything, run

```bash
$ bower install
$ npm install
```

The ReactJS JSX files (essentially the source files for the client application)
need to be compiled before they can be used. Until I can think of (or find the
standard way of) distributing the compiled JSX files, I run the JSX compiler
in "watch" mode from the `public` directory:

```bash
$ jsx -w react_src/ public/build/
```

This won't terminate; it will continuously compile your JSX files in `react_src`
and report any syntax errors.

To run the server, run

```bash
$ npm start
```

from the repository's root directory.


## TODOs

* DOCUMENTATION
* Fix units on republish
* Add ability to save queries as a name? e.g. save Metadata/HVAC/Zone = "Conference" as "Conference HVAC" from a drop down menu?
    * save in mongodb behind the app, probably
* Flash rows when they update
* add the autocomplete, +/- interface like tyler had for the old status page
* ~~add ability to sort rows by each available column~~
