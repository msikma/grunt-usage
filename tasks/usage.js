'use strict';

var ArgumentParser = require('argparse').ArgumentParser;
var _ = require('lodash');
var EOL = require('os').EOL;

/**
 * Returns the options object for grunt-usage.
 *
 * Helper function in order to avoid a fatal error when the options
 * object has not been defined yet.
 *
 * @returns {Object} The usage options object
 */
function getUsageOptions() {
  var configData = this.config.data;
  if (configData.usage && configData.usage.options) {
    return configData.usage.options;
  }
  return {};
}

/**
 * Returns the user's package file contents. This is used for the name
 * and description of the usage description.
 *
 * @returns {Object} The package info object
 */
function getPackageInfo() {
  var configData = this.config.data;
  if (configData.pkg) {
    return configData.pkg;
  }
  return {};
}

/**
 * Returns a formatted version of a description string. Chiefly, it
 * ensures that each line ends with a valid end-of-sentence marker,
 * mostly a period.
 *
 * @param {String} str The description string to format and return
 * @param {Object} formattingOptions Formatting options object
 * @returns {String} The formatted string
 */
function formatDescription(str, formattingOptions) {
  var end = '.', endRe = new RegExp('[\\.\\!\\?]{1}[\\)\\]"\']*?$');

  // Apply a fallback in case we're trying to format a null or undefined.
  if (!str) {
    str = 'N/A';
  }

  // Add a period in case no valid end-of-sentence marker is found.
  if (formattingOptions.addPeriod) {
    if (endRe.test(str) === false) {
      str = str + end;
    }
  }

  return str;
}

/**
 * Formats and returns the usage help string to conform to our specifications.
 *
 * @param {String} usageHelp The return value of argparse's formatHelp()
 * @returns {String} The formatted usage help string
 */
function formatUsageHelp(usageHelp) {
  // Apply a really dirty hack to make the output more Grunt-friendly.
  // This should be replaced as soon as Node argparse becomes able to
  // use custom strings for things such as the "Positional arguments" header.
  return usageHelp;
}

/**
 * Formats and returns the user's header string or array.
 *
 * @param {Array|String} headerContent The usage header option string or array
 * @returns {String} The formatted usage header string
 */
function formatUsageHeader(headerContent) {
  var headerString =  headerContent instanceof Array ?
    headerContent.join(EOL) :
    headerContent;

  return headerString + EOL;
}

/**
 * Performs a final processing run on the usage string and then returns it.
 *
 * The most major modification we do is removing the dash at the start of
 * the Grunt task names. This is a hack to work around the fact that
 * argparse won't show a valid usage string at the top of the help dialog
 * unless we use optional arguments.
 *
 * Optional arguments are always indicated with one or more preceding dashes,
 * so we add them to get argparse to do what we want, and then remove them
 * just before output. They can be safely filtered out.
 *
 * @param {Object} grunt The Grunt object
 * @param {String} usageHeader The formatted usage header string
 * @param {String} usageHelp The output from Node argparse
 * @returns {String} The processed string
 */
function formatUsage(grunt, usageHeader, usageHelp) {
  var usageString = '',
      reUsage = [new RegExp('\\[-(.+?)\\]', 'g'), '[$1]'],
      reTasks = [new RegExp('^[ ]{2}-([^\\s]*)', 'mg'), '  $1 '];

  usageString += usageHeader;

  usageHelp = usageHelp.replace(reUsage[0], reUsage[1]);
  usageHelp = usageHelp.replace(reTasks[0], reTasks[1]);

  usageString += usageHelp;

  // One final pass to ensure linebreak normalization.
  return grunt.util.normalizelf(usageString);
}

/**
 * Hides Grunt's task header output, e.g.: 'Running "foo" task'.
 */
function hideTaskHeaders(grunt) {
  grunt.log.header = function() { /* NOP */ };
}

/**
 * Adds a task group to the parser.
 * 
 * @param {Object} taskGroup The task group object
 * @param {Object} grunt The global Grunt object
 * @param {ArgumentParser} parser The global ArgumentParser object
 * @param {Object} descriptionOverrides Task description overrides
 * @param {Object} formattingOptions Options that determine the formatting
 */
function addTaskGroup(taskGroup, grunt, parser, descriptionOverrides,
                      formattingOptions) {
  var parserGruntTasks;
  var taskName, taskInfo;
  var n;

  // Create the parser for this group.
  parserGruntTasks = parser.addArgumentGroup({
    title: taskGroup.header ? taskGroup.header : 'Grunt tasks',
    required: false
  });

  // Iterate through all tasks that we want to see in the output.
  for (n = 0; n < taskGroup.tasks.length; ++n) {
    taskName = taskGroup.tasks[n];
    taskInfo = grunt.task._tasks[taskName];

    // Add a task to the argument parser using either the user's
    // description override or its package.json description.
    parserGruntTasks.addArgument(['-' + taskName], {
        'nargs': 0,
        'required': false,
        'help': formatDescription(
          descriptionOverrides[taskName] ?
            descriptionOverrides[taskName] :
            taskInfo.info,
          formattingOptions
        )
      }
    );
  }
}

module.exports = function(grunt) {
  // Retrieve configuration info, including the options for the usage
  // task prior to the task's execution.
  // We override the package info object with the passed options.
  var usageOptions = getUsageOptions.apply(this);
  var packageInfo = _.extend(getPackageInfo.apply(this), usageOptions);

  var usageHeader, usageHelp, usageContent, usageString,
      formattingOptions, formattingDefaults,
      parser;

  // If the user has set the hideTasks argument to true, we'll hide the
  // task title log output (unless the --show-titles cli argument is passed.)
  // See <https://github.com/gruntjs/grunt/issues/895>.
  if (!usageOptions.hideTasks === true && !grunt.cli.options['show-tasks']) {
    hideTaskHeaders(grunt);
  }

  // Merge the user's passed formatting options with our defaults.
  formattingDefaults = {addPeriod: true};
  formattingOptions = usageOptions.formatting ?
    _.extend(formattingDefaults, usageOptions.formatting) :
    formattingDefaults;

  // Construct the parser object using data from the user's package.
  parser = new ArgumentParser({
    addHelp: false,
    description: formatDescription(packageInfo.description, formattingOptions)
  });

  grunt.registerTask('usage', 'Prints usage information', function() {
    var options;
    var descriptionOverrides;
    var n;

    // Merge defaults with user-passed options.
    options = this.options({
      'taskGroups': []
    });
    descriptionOverrides = options.taskDescriptionOverrides ?
      options.taskDescriptionOverrides :
      {};

    if (options.description) {
      parser.description = formatDescription(
        options.description, formattingOptions
      );
    }

    // Iterate over all task groups and add them to the parser.
    for (n = 0; n < options.taskGroups.length; ++n) {
      addTaskGroup(options.taskGroups[n], grunt, parser, descriptionOverrides,
        formattingOptions);
    }

    // Retrieve the help content and run it through our filter.
    usageHelp = formatUsageHelp(parser.formatHelp());

    // Add the header strings.
    usageHeader = formatUsageHeader(options.title);

    // Create the final string, putting everything together, then output it.
    usageString = formatUsage(grunt, usageHeader, usageHelp);
    grunt.log.write(usageString);
  });
};
