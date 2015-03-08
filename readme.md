Grunt-usage
===========

This plugin modifies the Grunt help output to be more user-friendly and
relevant to your specific project.

By default, the "available tasks" section in the `grunt --help` output is
not very helpful—for large projects, it often contains a lot of tasks
that aren't meant to be used directly, but are part of a larger script.

This plugin uses [argparse](https://github.com/nodeca/argparse) to display a
usage overview that's relevant only to your tasks, and also allows you to
hide the extraneous information that Grunt outputs while it's running a script.


Installation and setup
----------------------

This assumes you're using [npm](https://www.npmjs.com/) to manage your
project's dependencies. See the [npm docs](https://docs.npmjs.com/cli/init) for
a tutorial on how to initialize a new project if you haven't already.

First, save the plugin to your project:

    npm install --save-dev grunt-usage

Then edit your `Gruntfile.js` and add the following:

```javascript
grunt.initConfig({
  // ... other stuff here

  // Usage - displays usage information in a user-friendly manner
  'usage': {
    options: {
      'title': 'My Awesome Website <https://site.com/>\n(C) 2015, MIT\n',
      // add all the tasks you want to display:
      'tasks': ['dev-build', 'release', 'jshint', 'jscs'],
    }
  }
});
```

This will display the following output when running `grunt usage`:

```
My Awesome Website <https://site.com/>
(C) 2015, MIT

usage: grunt [dev] [release] [jshint] [jscs]

Your package.json description value goes here.

Grunt tasks:
  dev       Runs a development server on localhost:8000.
  release   Compiles a release build of the website.
  jshint    Validate files with JSHint.
  jscs      JavaScript Code Style checker.
```

We recommend setting the default task to `usage` to get this output
whenever you invoke just the `grunt` command:

    grunt.registerTask('default', ['usage']);

You can still get the default Grunt help text by running `grunt --help`.


### options

#### options.title

* Type: `Array|String`

A title that's printed at the top of the usage output. You can pass either
a string or an array (which will be joined with line breaks). This is a good
place to add a copyright notice. You can [add some colors with an
undocumented feature](http://stackoverflow.com/a/27496257/3553425).

#### options.tasks

* Type: `Array`

An array containing the tasks you'd like to show in the usage output. Note that
you should use the *task names*, not the package names—e.g. `'jshint'` instead
of `'grunt-contrib-jshint'`.

#### options.hideTasks

* Type: `Boolean`
* Default: `false`

This causes the Grunt task header output to be hidden, i.e. the *"Running
'task-name:target' (task-name) task"* notifications. Note that this is a global
setting that applies to all other tasks as well, as long as this plugin is
initialized.

You can get the task header output back by passing the `--show-tasks` argument
in the command line, even with this option set to true.

#### options.formatting

##### options.formatting.addPeriod

* Type: `Boolean`
* Default: `true`

Ensures that each description line ends with a period.

#### options.description

* Type: `String`
* Default: the `description` field from your project's `package.json`

By default, we show the description from the `package.json` file. Passing
a `description` variable will override this.

#### options.taskHeader

* Type: `String`
* Default: `"Grunt tasks"`

The section header displayed above the list of supported Grunt tasks.

#### options.taskDescriptionOverrides

* Type: `Object`

Allows you to define alternate descriptions for your tasks. For example,
if you don't like the `jscs` description (which is just "JavaScript Code
Style checker"), you can override it here and type something more descriptive,
such as "Checks code compliance with the style guide. See
<http://site.com/styleguide/>."

### Example with all options set

```javascript
'usage': {
  options: {
    'title': [
        'My Awesome Website <https://site.com/>',
        '(C) '+new Date().getFullYear()+', MIT license',
        ''
    ],
    'tasks': ['dev', 'release', 'jshint', 'jscs'],
    'hideTasks': true, // hide task header output
    'formatting': {
      'addPeriod': true
    },
    'description': 'Task runner setup for My Awesome Website. If you\'re ' +
      'lost, go to <http://mysite.com/documentation/> for more information.',
    'taskHeader': 'Build tasks',
    'taskDescriptionOverrides': {
      'jscs': 'Ensures code compliance with the Google JS Style Guide. ' +
        'Details can be found at <http://goo.gl/tJaiiP>.',
      'jshint': 'Runs the JSHint linter on the library code.'
    }
  }
}
```

This produces:

```
My Awesome Website <https://site.com/>
(C) 2015, MIT license

usage: grunt [dev] [release] [jshint] [jscs]

Task runner setup for My Awesome Website. If you're lost, go to
<http://mysite.com/documentation/> for more information.

Build tasks:
  dev       Runs a development server on localhost:8000.
  release   Compiles a release build of the website.
  jshint    Runs the JSHint linter on the library code.
  jscs      Ensures code compliance with the Google JS Style Guide. Details
            can be found at <http://goo.gl/tJaiiP>.
```

(Unfortunately, we can't hide the 'done, without errors' line at the end.)


Copyright
---------

© 2015, Michiel Sikma. MIT license.

See the included license.md file.
